"use client";

import { useRef, useState, useEffect } from "react";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => Promise<void> | void;
  onInterimTranscript?: (text: string) => void;
  continuous?: boolean;
}

export function useVoiceRecorder({
  onTranscript,
  onInterimTranscript,
  continuous = false,
}: UseVoiceRecorderOptions) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // true while the user has activated voice and not explicitly stopped
  const activeRef = useRef(false);

  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterimTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onInterimRef.current = onInterimTranscript; }, [onInterimTranscript]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildRecognition(): any | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      console.warn("[useVoiceRecorder] SpeechRecognition not supported in this browser.");
      return null;
    }
    const rec = new SR();
    rec.continuous = false;      // browser auto-stops after a pause → we restart the loop
    rec.interimResults = true;   // fires live as user speaks
    rec.lang = "en-US";
    return rec;
  }

  async function startSession() {
    if (!activeRef.current) return;

    const rec = buildRecognition();
    if (!rec) {
      activeRef.current = false;
      return;
    }
    recognitionRef.current = rec;

    let finalTranscript = "";

    rec.onstart = () => setListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTranscript += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      onInterimRef.current?.(finalTranscript + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      // "no-speech" and "aborted" are expected in normal operation
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("[useVoiceRecorder] Recognition error:", event.error);
      }
    };

    rec.onend = async () => {
      setListening(false);
      recognitionRef.current = null;

      const trimmed = finalTranscript.trim();

      if (trimmed) {
        // Linger for 1s so the user can see their spoken text before it clears
        setTimeout(() => onInterimRef.current?.(""), 1000);
        setProcessing(true);
        try {
          // Awaiting here means the recorder waits for TTS to finish before restarting
          await onTranscriptRef.current(trimmed);
        } finally {
          setProcessing(false);
        }
      }

      if (continuous && activeRef.current) {
        // Brief pause so any ongoing TTS / audio doesn't immediately feed back into the mic
        await new Promise<void>((r) => setTimeout(r, 400));
        startSession();
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error("[useVoiceRecorder] Could not start recognition:", err);
      setListening(false);
    }
  }

  async function toggle() {
    if (processing) return;

    if (!activeRef.current) {
      activeRef.current = true;
      startSession();
    } else {
      stop();
    }
  }

  function stop() {
    activeRef.current = false;
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
    setProcessing(false);
  }

  return { listening, processing, toggle, stop };
}
