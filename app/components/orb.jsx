"use client";

import { useRef, useState } from "react";
import { useConvo } from "../lib/useConvo";


const CHUNK_MS = 3000;
const SPEECH_THRESHOLD = 0.025;
const SILENCE_THRESHOLD = 0.025;
const SILENCE_DURATION_MS = 500;

export default function Orb({ onComplete }) {
  const { processTranscript } = useConvo();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const[conversation, setConversation] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const monitorIntervalRef = useRef(null);

  const chunksRef = useRef([]);
  const speakingRef = useRef(false);
  const stoppedRef = useRef(false);
  const hasProcessedRef = useRef(false);
  const mimeTypeRef = useRef("audio/webm");

  const getRmsLevel = (analyser) => {
    const bufferLength = analyser.fftSize;
    const data = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / bufferLength);
  };

  const cleanupRecording = () => {
    if (monitorIntervalRef.current) {
      window.clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }

    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    analyserRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    speakingRef.current = false;
    stoppedRef.current = false;
    hasProcessedRef.current = false;
  };

  const startRecording = async () => {
    stoppedRef.current = false;
    speakingRef.current = false;
    hasProcessedRef.current = false;
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    source.connect(analyser);

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

    mimeTypeRef.current = mimeType;

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;

      setProcessing(true);
      setListening(false);
      try {
        await sendFinalAudio();
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setProcessing(false);
        cleanupRecording();
      }
    };

    recorder.start(CHUNK_MS);

    monitorIntervalRef.current = window.setInterval(() => {
      if (!analyserRef.current || stoppedRef.current) return;

      const level = getRmsLevel(analyserRef.current);

      if (level >= SPEECH_THRESHOLD) {
        speakingRef.current = true;

        if (silenceTimerRef.current) {
          window.clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        return;
      }

      if (speakingRef.current && level <= SILENCE_THRESHOLD) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (!stoppedRef.current && mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
            }
          }, SILENCE_DURATION_MS);
        }
      }
    }, 100);
  };

  const sendFinalAudio = async () => {
    if (chunksRef.current.length === 0) {
      console.warn("No audio chunks captured.");
      return;
    }

    const finalBlob = new Blob(chunksRef.current, {
      type: mimeTypeRef.current,
    });

    const form = new FormData();
    const extension = mimeTypeRef.current.includes("webm") ? "webm" : "ogg";
    form.append("file", finalBlob, `recording.${extension}`);

    const res = await fetch("https://nonvertebral-winter-pronunciative.ngrok-free.dev/transcribe", {
      method: "POST",
      body: form,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Transcribe failed (${res.status}): ${text}`);
    }

    const data = JSON.parse(text);

    if (data.transcript) {
      await processTranscript(data.transcript, {
        onAssistantFinished: ({ products, resultCount }) => {
          if (resultCount === 0) {
            setListening(true);
            startRecording().catch((err) => {
              console.error("Could not restart recording:", err);
              cleanupRecording();
              setListening(false);
            });
          }else{
            setConversation(true);
            onComplete?.({ products, resultCount });
          }
        },
      });
    }
  };

  const stopRecording = async () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      cleanupRecording();
      setListening(false);
    }
  };

  const toggle = async () => {
    if (processing) return;

    if (!listening) {
      setListening(true);
      try {
        await startRecording();
      } catch (err) {
        console.error("Could not start recording:", err);
        cleanupRecording();
        setListening(false);
      }
    } else {
      await stopRecording();
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