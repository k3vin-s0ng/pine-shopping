"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { speakWithInworld } from "../lib/tts/inworldTTS";

// [KEVIN - Whisper pipeline: restore for Data Agent integration]
// The constants below were used by the MediaRecorder/ngrok STT pipeline.
// Keep for reference — do not delete.
// const NGROK_TRANSCRIBE_URL = "https://nonvertebral-winter-pronunciative.ngrok-free.dev/transcribe";
// const CHUNK_MS = 3000;
// const SPEECH_THRESHOLD = 0.025;
// const SILENCE_THRESHOLD = 0.025;
// const SILENCE_DURATION_MS = 500;

export default function Orb({ onComplete: _onComplete, onInterimTranscript, onListeningChange }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [talking, setTalking] = useState(false);
  // Conversation state held in refs to avoid stale closures in async SpeechRecognition callbacks
  const historyRef = useRef([]);
  const accumulatedIntentRef = useRef({});

  const recognitionRef = useRef(null);
  // true while the user has activated the orb and has not explicitly stopped
  const activeRef = useRef(false);

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
        setTalking(true);
        await speakWithInworld(data.chatResponse);
        setTalking(false);
        setProcessing(false);
        if (activeRef.current) startSession();
      } else {
        // Speak confirmation before handing off, then route
        const confirmation = data.chatResponse || `Let me look for ${transcript}.`;
        setTalking(true);
        await speakWithInworld(confirmation);
        setTalking(false);
        localStorage.setItem("pineHandoff", JSON.stringify({
          history: historyRef.current,
          accumulatedIntent: accumulatedIntentRef.current,
          lastQuery: transcript,
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
    <div className="orb-wrap">
      <div className="orb-halo orb-halo-1"></div>
      <div className="orb-halo orb-halo-2"></div>

      <div
        className={`orb ${listening ? "listening" : ""} ${processing ? "processing" : ""}`}
        onClick={toggle}
      >
        <div className="waveform">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>
      </div>
    </div>
  );
}
