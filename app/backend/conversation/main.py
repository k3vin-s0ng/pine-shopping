from __future__ import annotations

import base64
import os
import shutil
import sys
import tempfile
import wave
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

import numpy as np
import requests
import sounddevice as sd
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI()
load_dotenv()

# -----------------------------
# Config
# -----------------------------
SAMPLE_RATE = 16000
CHANNELS = 1
RECORDING_DURATION = 3  # seconds per chunk
SPIKE_THRESHOLD = 500  # adjust for your mic
OUTPUT_DIR = "recordings"

API_KEY = os.getenv("OPENROUTER_API_KEY", default=None)
MODEL_NAME = "google/gemini-2.0-flash-lite-001"


# -----------------------------
# Audio helpers
# -----------------------------
def audio_spike(data: np.ndarray) -> float:
    """
    Returns RMS level of the chunk.
    This is usually more stable than max-abs peak detection.
    """
    x = data.astype(np.float64)
    return float(np.sqrt(np.mean(x * x)))


def record_chunk() -> np.ndarray:
    """
    Record a single chunk of audio.
    Returns a 1D int16 array.
    """
    audio = sd.rec(
        int(SAMPLE_RATE * RECORDING_DURATION),
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="int16",
    )
    sd.wait()
    return audio.flatten()


def save_chunk(data: np.ndarray, index: int) -> str:
    """
    Save a single chunk as WAV.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(OUTPUT_DIR, f"spike_{timestamp}_{index:03d}.wav")

    with wave.open(filename, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data.tobytes())

    return filename


def merge_wav_files(audio_files: list[str], merged_path: str) -> str:
    """
    Merge multiple WAV files into one WAV file.
    Assumes all files have the same format:
    - same sample rate
    - same channels
    - same sample width
    """
    if not audio_files:
        raise ValueError("No audio files provided to merge.")

    with wave.open(audio_files[0], "rb") as first:
        params = first.getparams()
        nchannels = first.getnchannels()
        sampwidth = first.getsampwidth()
        framerate = first.getframerate()
        comptype = first.getcomptype()
        compname = first.getcompname()

    with wave.open(merged_path, "wb") as out:
        out.setnchannels(nchannels)
        out.setsampwidth(sampwidth)
        out.setframerate(framerate)
        out.setcomptype(comptype, compname)

        for path in audio_files:
            with wave.open(path, "rb") as wf:
                if (
                    wf.getnchannels() != nchannels
                    or wf.getsampwidth() != sampwidth
                    or wf.getframerate() != framerate
                    or wf.getcomptype() != comptype
                ):
                    raise ValueError(f"Audio format mismatch in file: {path}")

                out.writeframes(wf.readframes(wf.getnframes()))

    return merged_path


# -----------------------------
# Transcription
# -----------------------------
def transcribe_wav_file(audio_path: str) -> str:
    """
    Send a WAV file to OpenRouter for transcription.
    Assumes the API supports input_audio in chat completions.
    """
    if not API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not set.")

    with open(audio_path, "rb") as audio_file:
        encoded_audio = base64.b64encode(audio_file.read()).decode("utf-8")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_NAME,
        "temperature": 0.0,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a transcriber. Output ONLY the raw text verbatim. "
                    "Standardize colloquialisms unless the speech is extremely informal."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Transcribe audio verbatim. Output raw text only."},
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": encoded_audio,
                            "format": "wav",
                        },
                    },
                ],
            },
        ],
    }

    response = requests.post(url, headers=headers, json=payload, timeout=120)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=f"Upstream API Error: {response.text}")

    result = response.json()
    transcript = result["choices"][0]["message"]["content"]
    return transcript.strip()


# -----------------------------
# Spike-session recording logic
# -----------------------------
def record_spike_sequence(spike_threshold: float = SPIKE_THRESHOLD) -> list[str]:
    """
    Record chunks until:
      1) a chunk crosses the spike threshold, then
      2) we keep saving loud chunks, and
      3) stop after the first quiet chunk after speech has started.

    Returns:
        List of saved WAV chunk paths.
    """
    print(f"[*] Listening... (RMS threshold = {spike_threshold})")
    print(f"[*] Saving chunks to '{OUTPUT_DIR}/'")

    saved_files: list[str] = []
    started = False
    chunk_index = 0

    while True:
        audio = record_chunk()
        level = audio_spike(audio)

        print(f"    Chunk #{chunk_index:04d}  RMS = {level:8.1f}", end="")

        if level >= spike_threshold:
            started = True
            filename = save_chunk(audio, chunk_index)
            saved_files.append(filename)
            print(f"  ← SPIKE! Saved → {filename}")
        else:
            print("  (quiet, discarded)")
            if started:
                print(f"\n[✓] Spike sequence ended. {len(saved_files)} chunk(s) saved.")
                break

        chunk_index += 1

    return saved_files


def record_and_transcribe() -> str:
    """
    Record a spike-triggered sequence, merge the saved chunks,
    transcribe them once, and return the transcript.
    """
    saved_files = record_spike_sequence()

    if not saved_files:
        print("[!] No speech detected.")
        return ""

    tmp_dir = Path(tempfile.mkdtemp())
    try:
        merged_path = str(tmp_dir / "merged.wav")
        merge_wav_files(saved_files, merged_path)

        print(f"[*] Transcribing merged audio from {len(saved_files)} chunk(s)...")
        transcript = transcribe_wav_file(merged_path)

        print(f"[✓] Transcript: {transcript}\n")
        return transcript
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

"""
# -----------------------------
# FastAPI route, if you still want it
# -----------------------------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    tmp_dir = None
    try:
        tmp_dir = Path(tempfile.mkdtemp())
        original_path = tmp_dir / f"{file.filename}"
        with original_path.open("wb") as f:
            f.write(await file.read())

        transcript = transcribe_wav_file(str(original_path))
        return {"status": "success", "transcript": transcript}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if tmp_dir:
            shutil.rmtree(tmp_dir, ignore_errors=True)

"""
# -----------------------------
# Main entry point
# -----------------------------
def main():
    transcript = record_and_transcribe()
    print(transcript)
    return transcript


if __name__ == "__main__":
    main()