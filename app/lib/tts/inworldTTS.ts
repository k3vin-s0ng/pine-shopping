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

export async function speakWithInworld(text: string): Promise<void> {
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
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        console.error("[InworldTTS] Audio element error:", e);
        reject(new Error("Audio playback failed"));
      };
      audio.play().then(() => {
        console.log("[InworldTTS] audio.play() succeeded");
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
