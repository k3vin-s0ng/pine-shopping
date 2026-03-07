import sounddevice as sd
import numpy as np
import wave
import os
import queue
import io
from datetime import datetime
from pydub import AudioSegment

RECORDING_DURATION = 3
SAMPLE_RATE = 44100
CHANNELS = 1
SPIKE_THRESHOLD = 500
MP3_BITRATE = "192k"
OUTPUT_DIR = "recordings"

FRAMES_PER_RECORDING = SAMPLE_RATE * RECORDING_DURATION
audio_queue = queue.Queue()


def stream_callback(indata, frames, time, status):
    audio_queue.put(indata.copy())


# USED TO SEE AUDIO SPIKES AND SEE WHETHER OR NOT THE PERSON IS TALKING OR NOT
def audio_spike(data: np.ndarray) -> float:
    return float(np.max(np.abs(data.astype(np.float64))))


def numpy_to_audiosegment(data: np.ndarray) -> AudioSegment:
    buf = io.BytesIO()
    with wave.open(buf, "w") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(data.tobytes())
    buf.seek(0)
    return AudioSegment.from_wav(buf)


# THIS IS THE 3 SECOND RECORDING PART OF THE CODE
def record_chunk(buffer: np.ndarray):
    """Drain the audio queue into the buffer and return the next chunk + remaining buffer."""
    while not audio_queue.empty():
        block = audio_queue.get_nowait().flatten()
        buffer = np.concatenate((buffer, block))

    if len(buffer) >= FRAMES_PER_RECORDING:
        chunk  = buffer[:FRAMES_PER_RECORDING]
        buffer = buffer[FRAMES_PER_RECORDING:]
        return (buffer, (chunk * 32767).astype(np.int16))
    return (buffer, None)


def save_chunk(segments: list, index: int) -> str:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(OUTPUT_DIR, f"spike_{timestamp}_{index:03d}.mp3")
    combined = sum(segments)
    combined.export(filename, format="mp3", bitrate=MP3_BITRATE)
    return filename


def main():
    print(f"[*] Listening… (spike threshold = {SPIKE_THRESHOLD})")
    print(f"[*] Recordings will be saved to '{OUTPUT_DIR}/'")
    print("[*] Press Ctrl+C to stop manually.\n")

    in_spike_sequence = False
    saved_count = 0
    chunk_index = 0
    buffer = np.empty((0,), dtype=np.float32)
    spike_segments = []

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="float32",
        blocksize=1024,
        callback=stream_callback,
    ):
        try:
            while True:
                buffer, audio = record_chunk(buffer)

                if audio is None:
                    continue  # not enough audio yet, keep filling

                level = audio_spike(audio)
                print(f"    Chunk #{chunk_index:04d}  Peak = {level:7.1f}", end="")

                if level >= SPIKE_THRESHOLD:
                    spike_segments.append(numpy_to_audiosegment(audio))
                    saved_count += 1
                    in_spike_sequence = True
                    print(f"  <- SPIKE! (segment {len(spike_segments)} collected)")
                else:
                    print("  (quiet, discarded)")
                    if in_spike_sequence:
                        filename = save_chunk(spike_segments, chunk_index)
                        print(f"\n[OK] Spike sequence ended. Saved -> {filename}")
                        break

                chunk_index += 1

        except KeyboardInterrupt:
            print("\n[!] Interrupted by user.")
            if spike_segments:
                filename = save_chunk(spike_segments, chunk_index)
                print(f"[OK] Saved -> {filename}")


if __name__ == "__main__":
    main()