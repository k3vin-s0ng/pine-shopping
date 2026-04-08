"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { speakWithInworld } from "../lib/tts/inworldTTS";
import { dotPulse } from "ldrs";
if (typeof window !== "undefined") dotPulse.register();

// [KEVIN - Whisper pipeline: restore for Data Agent integration]
// The constants below were used by the MediaRecorder/ngrok STT pipeline.
// Keep for reference — do not delete.
// const NGROK_TRANSCRIBE_URL = "https://nonvertebral-winter-pronunciative.ngrok-free.dev/transcribe";
// const CHUNK_MS = 3000;
// const SPEECH_THRESHOLD = 0.025;
// const SILENCE_THRESHOLD = 0.025;
// const SILENCE_DURATION_MS = 500;

export default function Orb({ onComplete: _onComplete, onInterimTranscript, onListeningChange, onPineResponse, onProcessingStart, isProcessing }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Conversation state held in refs to avoid stale closures in async SpeechRecognition callbacks
  const historyRef = useRef([]);
  const accumulatedIntentRef = useRef({});

  const recognitionRef = useRef(null);
  // true while the user has activated the orb and has not explicitly stopped
  const activeRef = useRef(false);

  // Halo refs for rAF-driven speaking pulse
  const halo1Ref = useRef(null);
  const halo2Ref = useRef(null);
  const orbElRef = useRef(null);
  const rafRef = useRef(null);
  // Live RMS volume from Web Audio API — updated by speakWithInworld's onVolume callback
  const liveVolumeRef = useRef(0);

  // Lerp-based speaking animation — mirrors orb-ui's rAF approach.
  // Three sine waves at different frequencies/phases simulate the irregular
  // cadence of speech rather than a metronomic CSS keyframe loop.
  useEffect(() => {
    if (!speaking) {
      cancelAnimationFrame(rafRef.current);
      // Reset all inline styles so CSS takes back over
      if (halo1Ref.current) { halo1Ref.current.style.cssText = ""; }
      if (halo2Ref.current) { halo2Ref.current.style.cssText = ""; }
      if (orbElRef.current) { orbElRef.current.style.boxShadow = ""; }
      return;
    }

    const start = performance.now();
    // Current lerped values — start at resting state
    let scale1 = 1, scale2 = 1, opacity1 = 0.65, opacity2 = 0.65, glowR = 20;
    // Smoothed RMS — lerped separately so raw mic spikes don't jerk the halo
    let smoothV = 0;

    function frame(now) {
      const t = (now - start) / 1000; // seconds

      // Use live RMS from Web Audio API if available (> 0 means audio is playing and analysed).
      // Fall back to synthetic sines when Web Audio is unavailable (e.g. SpeechSynthesis fallback).
      const rms = liveVolumeRef.current;
      let rawV;
      if (rms > 0) {
        rawV = Math.min(rms * 5.0, 1.0);
      } else {
        const vol =
          0.55 * Math.sin(t * 10.0) +
          0.28 * Math.sin(t * 17.0 + 1.1) +
          0.17 * Math.sin(t * 27.0 + 2.4);
        rawV = (vol + 1.0) / 2.0;
      }
      // Smooth the raw signal before it drives anything — asymmetric attack/release
      // so the halo rises gently and decays slowly
      smoothV += (rawV > smoothV ? 0.08 : 0.04) * (rawV - smoothV);
      const v = smoothV;

      const targetScale1  = 1.0  + v * 0.55;  // 1.00 → 1.55 — halos breathe dramatically
      const targetScale2  = 1.02 + v * 0.38;  // 1.02 → 1.40 — lags behind halo1
      const targetOpacity = v * 1.0;           // 0.00 → 1.00 — full range, nearly invisible at troughs
      const targetGlow    = 8   + v * 140;     // 8px → 148px — enormous swing

      scale1   += (targetScale1  - scale1)   * 0.06;
      scale2   += (targetScale2  - scale2)   * 0.04;
      opacity1 += (targetOpacity - opacity1) * 0.06;
      opacity2 += (targetOpacity - opacity2) * 0.04;
      glowR    += (targetGlow    - glowR)    * 0.05;

      // Deep dark green — reads as a dark aura against light backgrounds
      const a1   = (v * 0.92).toFixed(3);            // 0.00 → 0.92
      const a2   = (v * 0.78).toFixed(3);            // 0.00 → 0.78
      const aMid = (v * 0.55).toFixed(3);
      const brightness = (0.02 + v * 0.38).toFixed(3); // 0.02 → 0.40 — stays genuinely dark
      const saturate   = (1.0  + v * 5.0).toFixed(3);  // 1.0  → 6.0

      if (halo1Ref.current) {
        halo1Ref.current.style.animation  = "none";
        halo1Ref.current.style.transform  = `scale(${scale1.toFixed(4)})`;
        halo1Ref.current.style.opacity    = opacity1.toFixed(4);
        halo1Ref.current.style.background = `radial-gradient(circle, rgba(4,28,12,${a1}) 0%, rgba(6,40,18,${aMid}) 45%, transparent 72%)`;
        halo1Ref.current.style.filter     = `brightness(${brightness}) saturate(${saturate})`;
      }
      if (halo2Ref.current) {
        halo2Ref.current.style.animation  = "none";
        halo2Ref.current.style.transform  = `scale(${scale2.toFixed(4)})`;
        halo2Ref.current.style.opacity    = opacity2.toFixed(4);
        halo2Ref.current.style.background = `radial-gradient(circle, rgba(4,28,12,${a2}) 0%, transparent 65%)`;
        halo2Ref.current.style.filter     = `brightness(${brightness}) saturate(${saturate})`;
      }
      if (orbElRef.current) {
        const g = glowR.toFixed(1);
        orbElRef.current.style.boxShadow = [
          "0 2px 0 rgba(255,255,255,.14) inset",
          "0 -6px 16px rgba(0,0,0,.22) inset",
          `0 28px 80px rgba(21,43,30,.55)`,
          `0 0 ${g}px rgba(45,97,71,${(v * 1.0).toFixed(3)})`,
          `0 0 0 ${(0.5 + v * 4).toFixed(2)}px rgba(45,97,71,${(v * 1.0).toFixed(3)})`,
        ].join(", ");
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speaking]);

  // [KEVIN - Whisper pipeline: restore for Data Agent integration]
  // The refs below were used by the MediaRecorder/ngrok STT pipeline.
  // const mediaRecorderRef = useRef(null);
  // const streamRef = useRef(null);
  // const audioContextRef = useRef(null);
  // const analyserRef = useRef(null);
  // const silenceTimerRef = useRef(null);
  // const monitorIntervalRef = useRef(null);
  // const chunksRef = useRef([]);
  // const speakingRef = useRef(false);
  // const stoppedRef = useRef(false);
  // const hasProcessedRef = useRef(false);
  // const mimeTypeRef = useRef("audio/webm");

  // [KEVIN - Whisper pipeline: restore for Data Agent integration]
  // getRmsLevel, cleanupRecording, and startRecording (MediaRecorder version) were here.
  // They have been replaced by browser SpeechRecognition below.
  //
  // const getRmsLevel = (analyser) => { ... };
  //
  // const cleanupRecording = () => {
  //   clearInterval(monitorIntervalRef.current); monitorIntervalRef.current = null;
  //   clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null;
  //   analyserRef.current = null;
  //   audioContextRef.current?.close().catch(() => {}); audioContextRef.current = null;
  //   streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
  //   mediaRecorderRef.current = null;
  //   speakingRef.current = false; stoppedRef.current = false; hasProcessedRef.current = false;
  // };
  //
  // const startRecording = async () => {
  //   stoppedRef.current = false; speakingRef.current = false;
  //   hasProcessedRef.current = false; chunksRef.current = [];
  //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //   streamRef.current = stream;
  //   const audioContext = new AudioContext(); audioContextRef.current = audioContext;
  //   const source = audioContext.createMediaStreamSource(stream);
  //   const analyser = audioContext.createAnalyser(); analyser.fftSize = 2048;
  //   analyserRef.current = analyser; source.connect(analyser);
  //   const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
  //     ? "audio/webm;codecs=opus"
  //     : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
  //   mimeTypeRef.current = mimeType;
  //   const recorder = new MediaRecorder(stream, { mimeType });
  //   mediaRecorderRef.current = recorder;
  //   recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
  //   recorder.onstop = async () => {
  //     if (hasProcessedRef.current) return; hasProcessedRef.current = true;
  //     setProcessing(true); setListening(false);
  //     try { await sendFinalAudio(); }
  //     catch (err) { console.warn("[Orb] Transcription unavailable — is the backend running?", err.message); }
  //     finally { setProcessing(false); cleanupRecording(); }
  //   };
  //   recorder.start(CHUNK_MS);
  //   monitorIntervalRef.current = setInterval(() => {
  //     if (!analyserRef.current || stoppedRef.current) return;
  //     const level = getRmsLevel(analyserRef.current);
  //     if (level >= SPEECH_THRESHOLD) {
  //       speakingRef.current = true;
  //       clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; return;
  //     }
  //     if (speakingRef.current && level <= SILENCE_THRESHOLD && !silenceTimerRef.current) {
  //       silenceTimerRef.current = setTimeout(() => {
  //         if (!stoppedRef.current && mediaRecorderRef.current) mediaRecorderRef.current.stop();
  //       }, SILENCE_DURATION_MS);
  //     }
  //   }, 100);
  // };

  // [KEVIN - Whisper pipeline: restore for Data Agent integration]
  // sendFinalAudio posted the recorded audio blob to the ngrok/Whisper endpoint.
  // Replace processTranscript call below with handleTurn(data.transcript) when restoring.
  //
  // const sendFinalAudio = async () => {
  //   if (chunksRef.current.length === 0) { console.warn("No audio chunks captured."); return; }
  //   const finalBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
  //   const ext = mimeTypeRef.current.includes("webm") ? "webm" : "ogg";
  //   const form = new FormData();
  //   form.append("file", finalBlob, `recording.${ext}`);
  //   const controller = new AbortController();
  //   const timeoutId = setTimeout(() => controller.abort(), 10000);
  //   let res;
  //   try {
  //     res = await fetch(NGROK_TRANSCRIBE_URL, { method: "POST", body: form, signal: controller.signal });
  //   } finally { clearTimeout(timeoutId); }
  //   const text = await res.text();
  //   if (!res.ok) throw new Error(`Transcribe failed (${res.status}): ${text}`);
  //   const data = JSON.parse(text);
  //   if (data.transcript) { await handleTurn(data.transcript); }
  // };

  async function handleTurn(transcript) {
    setProcessing(true);
    onProcessingStart?.();
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: transcript,
          history: historyRef.current,
          accumulatedIntent: accumulatedIntentRef.current,
        }),
      });
      const data = await res.json();

      // Append user + AI turns to local history
      const newHistory = [
        ...historyRef.current,
        { role: "user", content: transcript },
        ...(data.chatResponse ? [{ role: "ai", content: data.chatResponse }] : []),
      ];
      historyRef.current = newHistory;

      // Merge intent — mirrors client-side merge in app/conversation/page.jsx handleSubmit()
      if (data.intent) {
        const prev = accumulatedIntentRef.current;
        accumulatedIntentRef.current = {
          ...data.intent,
          hard_constraints: {
            ...prev.hard_constraints,
            ...data.intent.hard_constraints,
            must_have_attributes: [
              ...new Set([
                ...(prev.hard_constraints?.must_have_attributes ?? []),
                ...(data.intent.hard_constraints?.must_have_attributes ?? []),
              ]),
            ],
          },
          soft_preferences: {
            ...prev.soft_preferences,
            ...data.intent.soft_preferences,
            vibe_keywords: [
              ...new Set([
                ...(prev.soft_preferences?.vibe_keywords ?? []),
                ...(data.intent.soft_preferences?.vibe_keywords ?? []),
              ]),
            ],
          },
        };
      }

      if (data.clarificationNeeded) {
        // Speak the clarification question, then restart listening
        onPineResponse?.(data.chatResponse);
        liveVolumeRef.current = 0;
        setSpeaking(true);
        await speakWithInworld(data.chatResponse, undefined, (rms) => { liveVolumeRef.current = rms; });
        liveVolumeRef.current = 0;
        setSpeaking(false);
        setProcessing(false);
        if (activeRef.current) startSession();
      } else {
        // Speak confirmation before handing off, then route
        const confirmation = data.chatResponse || `Let me look for ${transcript}.`;
        onPineResponse?.(confirmation);
        liveVolumeRef.current = 0;
        setSpeaking(true);
        await speakWithInworld(confirmation, undefined, (rms) => { liveVolumeRef.current = rms; });
        liveVolumeRef.current = 0;
        setSpeaking(false);
        // Stop the recognition loop before navigating — prevents mic flash during the
        // Next.js route transition while activeRef is still true and rec.onend fires
        activeRef.current = false;
        if (recognitionRef.current) {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        }
        localStorage.setItem("pineHandoff", JSON.stringify({
          history: historyRef.current,
          accumulatedIntent: accumulatedIntentRef.current,
          lastQuery: transcript,
          products: data.products || [],
          chatResponse: confirmation,
        }));
        router.push("/conversation");
      }
    } catch (err) {
      console.error("[Orb] handleTurn error:", err);
      setProcessing(false);
      if (activeRef.current) startSession();
    }
  }

  function startSession() {
    if (!activeRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("[Orb] SpeechRecognition is not supported in this browser.");
      activeRef.current = false;
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.continuous = false;  // browser auto-detects end of speech
    rec.interimResults = true; // needed for live input-bar display
    rec.lang = "en-US";
    recognitionRef.current = rec;

    let finalTranscript = "";

    rec.onstart = () => {
      setListening(true);
      onListeningChange?.(true);
    };

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onInterimTranscript?.(finalTranscript + interim);
    };

    rec.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("[Orb] Recognition error:", event.error);
      }
    };

    rec.onend = async () => {
      setListening(false);
      onListeningChange?.(false);
      setTimeout(() => onInterimTranscript?.(""), 1000);
      recognitionRef.current = null;
      if (!activeRef.current) return;
      if (finalTranscript.trim()) {
        await handleTurn(finalTranscript.trim());
      } else {
        // No speech detected — restart silently
        startSession();
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error("[Orb] Could not start recognition:", err);
      setListening(false);
    }
  }

  const toggle = () => {
    if (processing) return;
    if (!activeRef.current) {
      activeRef.current = true;
      startSession();
    } else {
      activeRef.current = false;
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setListening(false);
      onListeningChange?.(false);
      onInterimTranscript?.("");
    }
  };

  return (
    <div className={`orb-wrap${speaking ? " speaking" : ""}`}>
      <div ref={halo1Ref} className="orb-halo orb-halo-1"></div>
      <div ref={halo2Ref} className="orb-halo orb-halo-2"></div>

      <div
        ref={orbElRef}
        className={`orb ${listening ? "listening" : ""} ${processing ? "processing" : ""}`}
        onClick={toggle}
      >
        {isProcessing ? (
          <div className="orb-loader">
            <l-dot-pulse size="35" speed="1.3" color="#F5F0E8"></l-dot-pulse>
          </div>
        ) : (
          <div className="waveform">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="wave-bar" />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
