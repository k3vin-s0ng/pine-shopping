// Server-side proxy at /api/tts handles the Inworld API call to avoid CORS.
// INWORLD_TTS_API_KEY must be set in .env.local (no NEXT_PUBLIC_ prefix needed).

export const DEFAULT_VOICE = "Ashley";

function speakFallback(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang === "en-US" &&
          /samantha|google us english|zira/i.test(v.name)
      ) ?? voices.find((v) => v.lang.startsWith("en"));

    if (preferred) utterance.voice = preferred;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export async function speakWithInworld(
  text: string,
  onStart?: () => void,
  onVolume?: (rms: number) => void,
): Promise<void> {
  if (!text) return;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const body = (await response.json()) as { audioContent?: string; error?: string };
    console.log("[InworldTTS] proxy response ok:", response.ok, "| error:", body.error ?? "none", "| audioContent present:", !!body.audioContent);

    if (!response.ok) {
      throw new Error(body.error ?? `TTS proxy returned ${response.status}`);
    }

    if (!body.audioContent) throw new Error("No audioContent in proxy response");

    const bytes = Uint8Array.from(atob(body.audioContent), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    console.log("[InworldTTS] Starting audio playback, duration will be determined on load");

    await new Promise<void>((resolve, reject) => {
      let volumeRaf: number | null = null;
      let audioCtx: AudioContext | null = null;

      audio.onended = () => {
        if (volumeRaf !== null) cancelAnimationFrame(volumeRaf);
        audioCtx?.close();
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        if (volumeRaf !== null) cancelAnimationFrame(volumeRaf);
        audioCtx?.close();
        URL.revokeObjectURL(url);
        console.error("[InworldTTS] Audio element error:", e);
        reject(new Error("Audio playback failed"));
      };
      audio.play().then(() => {
        console.log("[InworldTTS] audio.play() succeeded");
        onStart?.();

        // Wire up real-time amplitude analysis via Web Audio API
        if (onVolume) {
          const emitVolume = onVolume;
          try {
            audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(audio);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.6;
            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            const data = new Uint8Array(analyser.frequencyBinCount);

            function pollVolume() {
              analyser.getByteTimeDomainData(data);
              // RMS of signed amplitude (byte data is offset by 128)
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                const s = (data[i] - 128) / 128;
                sum += s * s;
              }
              emitVolume(Math.sqrt(sum / data.length));
              volumeRaf = requestAnimationFrame(pollVolume);
            }
            volumeRaf = requestAnimationFrame(pollVolume);
          } catch (e) {
            console.warn("[InworldTTS] Web Audio API unavailable, volume analysis skipped:", e);
          }
        }
      }).catch((e) => {
        console.error("[InworldTTS] audio.play() rejected:", e);
        reject(e);
      });
    });
  } catch (err) {
    console.warn("[InworldTTS] Falling back to Web Speech Synthesis:", err);
    await speakFallback(text);
  }
}
