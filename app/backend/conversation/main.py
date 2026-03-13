import sounddevice as sd
import numpy as np
import wave
import os
import time
from datetime import datetime
import whisper
from pydub import AudioSegment
import tempfile
import re

RECORDING_DURATION = 3
SAMPLE_RATE = 44100
CHANNELS = 1
SPIKE_THRESHOLD = 2000
OUTPUT_DIR = "recordings"
WHISPER_MODEL = whisper.load_model("base")


FRAMES_PER_RECORDING = SAMPLE_RATE*RECORDING_DURATION

# USED TO SEE AUDIO SPIKES AND SEE WHETHER OR NOT THE PERSON IS TALKING OR NOT
def audio_spike(data: np.ndarray) -> float:
    return float(np.max(np.abs(data.astype(np.float64))))

#THIS IS THE 3 SECOND RECORDING PART OF THE CODE
def record_chunk() -> np.ndarray:
    audio = sd.rec(
        int(SAMPLE_RATE * RECORDING_DURATION),
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="int16",
    )
    sd.wait()  # block until recording is done
    return audio.flatten()


#This is temporary, will be changed to combine chunks or smth
def save_chunk(data: np.ndarray, index:int):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(OUTPUT_DIR, f"spike_{timestamp}_{index:03d}.wav")
    with wave.open(filename, "w") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)   # 16-bit = 2 bytes
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data.tobytes())
    return filename


def transcribe_audio_snippets(audio_files: list[str], model_size: str = "base") -> str:
    """
    Transcribes a list of audio snippet file paths and stitches them
    into a single sentence.

    Args:
        audio_files: Ordered list of audio file paths (e.g. ["clip_0.wav", "clip_1.wav"])
        model_size:  Whisper model to use — "tiny", "base", "small", "medium", "large"
                     Larger = more accurate but slower.

    Returns:
        A single stitched string of all transcribed audio.
    """
    if not audio_files:
        return ""

    # --- Option A: Transcribe each snippet individually then join ---
    transcripts = []
    for path in audio_files:
        result = WHISPER_MODEL.transcribe(path)
        text = result["text"].strip()
        if text:
            transcripts.append(text)

    stitched = " ".join(transcripts)

    # Clean up punctuation boundaries between clips
    # e.g. "Hello world.  How are you." → "Hello world. How are you."
    
    stitched = re.sub(r'\s+', ' ', stitched).strip()

    return stitched


def transcribe_by_merging(audio_files: list[str], model_size: str = "base") -> str:
    """
    Alternative approach: merges all audio clips into one file first,
    then transcribes in a single pass. Better for context continuity.

    Requires: pydub + ffmpeg installed on the system.
    """
    if not audio_files:
        return ""

    # Merge all clips into one AudioSegment
    combined = AudioSegment.empty()
    for path in audio_files:
        clip = AudioSegment.from_file(path)
        combined += clip

    # Write merged audio to a temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
        combined.export(tmp_path, format="wav")

    try:
        model = whisper.load_model(model_size)
        result = model.transcribe(tmp_path)
        return result["text"].strip()
    finally:
        os.unlink(tmp_path)  # Clean up temp file


def record_and_transcribe(model_size: str = "base") -> str:
    """
    Records audio chunks, detects speech via spike detection,
    and returns a single transcribed string of all speech detected.

    Args:
        model_size: Whisper model size — "tiny", "base", "small", "medium", "large"

    Returns:
        Transcribed string of all recorded speech, ready to pass to an AI.
    """
    print(f"[*] Listening… (spike threshold RMS = {SPIKE_THRESHOLD})")
    print(f"[*] Recordings will be saved to '{OUTPUT_DIR}/'")
    print("[*] Press Ctrl+C to stop manually.\n")

    in_spike_sequence = False
    saved_files = []
    chunk_index = 0

    try:
        while True:
            audio = record_chunk()
            level = audio_spike(audio)
            print(f"    Chunk #{chunk_index:04d}  RMS = {level:7.1f}", end="")

            if level >= SPIKE_THRESHOLD:
                filename = save_chunk(audio, chunk_index)
                saved_files.append(filename)
                in_spike_sequence = True
                print(f"  ← SPIKE! Saved → {filename}")
            else:
                print("  (quiet, discarded)")
                if in_spike_sequence:
                    print(f"\n[✓] Spike sequence ended. {len(saved_files)} chunk(s) saved.")
                    break

            chunk_index += 1

    except KeyboardInterrupt:
        print("\n[!] Interrupted by user.")

    if not saved_files:
        print("[!] No speech detected.")
        return ""

    print(f"[*] Transcribing {len(saved_files)} chunk(s)...")
    transcript = transcribe_by_merging(saved_files, model_size=model_size)
    print(f"[✓] Transcript: {transcript}\n")

    return transcript