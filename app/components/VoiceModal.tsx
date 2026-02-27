"use client";

import { useState, useRef } from "react";
import AvatarSVG from "./avatarsvg";

interface VoiceModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

type AvatarState = "idle" | "speaking" | "listening";

const SR =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : null;

export default function VoiceModal({ open, onClose, onResult }: VoiceModalProps) {
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!open) return null;

  function startListening() {
    if (!SR) {
      alert("Voice recognition requires Chrome or Edge.");
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-US";

    r.onstart = () => { setIsListening(true); setAvatarState("listening"); };
    r.onresult = (e: any) => {
      let final = "", interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim);
    };
    r.onend = () => {
      setIsListening(false);
      setAvatarState("idle");
      const t = transcript.trim();
      if (t) {
        setTimeout(() => { onClose(); onResult(t); setTranscript(""); }, 400);
      }
    };
    r.onerror = () => { setIsListening(false); setAvatarState("idle"); };

    recognitionRef.current = r;
    r.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  const statusLabel =
    avatarState === "speaking" ? "Sicero is speaking…" :
    avatarState === "listening" ? "Listening…" :
    "Press & hold to speak";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(7,9,26,0.92)", backdropFilter: "blur(20px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) { if (recognitionRef.current && isListening) recognitionRef.current.stop(); onClose(); } }}
    >
      <div
        className="relative flex flex-col items-center gap-5 w-[90%] max-w-[420px] rounded-[28px] p-12"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          onClick={() => { if (recognitionRef.current && isListening) recognitionRef.current.stop(); onClose(); }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all"
          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent" }}
        >
          ✕
        </button>

        {/* Avatar with orb rings */}
        <div className="relative w-[180px] h-[180px] flex items-center justify-center">
          <div className="orb-ring" />
          <div className="orb-ring" />
          <div className="orb-ring" />
          <AvatarSVG size={120} rounded="circle" state={avatarState} />
        </div>

        {/* Wave */}
        <div className={`voice-wave ${avatarState === "idle" ? "idle" : avatarState === "listening" ? "listening" : ""}`}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>

        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{statusLabel}</p>

        <p className="text-[14px] text-center italic min-h-[22px] max-w-[300px]" style={{ color: "var(--text-primary)", opacity: 0.8 }}>
          {transcript}
        </p>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          <button
            className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-all font-sans"
            style={isListening ? {
              background: "linear-gradient(135deg, #EF4444, #DC2626)",
              color: "#fff",
              border: "none",
              animation: "micP 1s ease infinite",
            } : {
              background: "linear-gradient(135deg, #4ADE80, #22C55E)",
              color: "#050505",
              border: "none",
            }}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            onMouseEnter={(e) => {
              if (!isListening) {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(74,222,128,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            🎙 {isListening ? "Listening…" : "Hold to Speak"}
          </button>
          <button
            onClick={() => { if (recognitionRef.current && isListening) recognitionRef.current.stop(); onClose(); }}
            className="px-5 py-3.5 rounded-full text-sm font-medium transition-all font-sans"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", background: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "var(--gold)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}