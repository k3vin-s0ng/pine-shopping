import sounddevice as sd
import numpy as np
import wave
import os
import time
from datetime import datetime

RECORDING_DURATION = 3
SAMPLE_RATE = 44100
CHANNELS = 1
SPIKE_THRESHOLD = 200
OUTPUT_DIR = "recordings"

FRAMES_PER_RECORDING = SAMPLE_RATE*RECORDING_DURATION

# USED TO SEE AUDIO SPIKES AND SEE WHETHER OR NOT THE PERSON IS TALKING OR NOT
def audio_spike(data: np.ndarray) -> float:
    return float(np.sqrt(np.mean(data.astype(np.float64) **2)))

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


def main():
    print(f"[*] Listening… (spike threshold RMS = {SPIKE_THRESHOLD})")
    print(f"[*] Recordings will be saved to '{OUTPUT_DIR}/'")
    print("[*] Press Ctrl+C to stop manually.\n")

    in_spike_sequence = False
    saved_count = 0
    chunk_index = 0

    try:
        while True:
            audio = record_chunk()
            level = audio_spike(audio)
            print(f"    Chunk #{chunk_index:04d}  RMS = {level:7.1f}", end="")

            if level >= SPIKE_THRESHOLD:
                filename = save_chunk(audio, chunk_index)
                saved_count += 1
                in_spike_sequence = True
                print(f"  ← SPIKE! Saved → {filename}")
            else:
                print("  (quiet, discarded)")
                if in_spike_sequence:
                    print(f"\n[✓] Spike sequence ended. {saved_count} chunk(s) saved to '{OUTPUT_DIR}/'.")
                    break

            chunk_index += 1

    except KeyboardInterrupt:
        print("\n[!] Interrupted by user.")
        if saved_count:
            print(f"[✓] {saved_count} chunk(s) saved to '{OUTPUT_DIR}/'.")


if __name__ == "__main__":
    main()