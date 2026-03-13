"use client";

import { useState, useRef, useLayoutEffect } from "react";
import AvatarSVG from "./avatarsvg";
import { Message } from "@/app/lib/useChat"

interface ChatPanelProps {
  messages: Message[];
  isTyping: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
  onOpenVoice: () => void;
}

const CHIPS = [
  "💻 Laptop for video editing",
  "🌿 Organic skincare routine",
  "🏃 Running shoes for flat feet",
];

const SR =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : null;

    
export default function ChatPanel({ messages, isTyping, onSend, onClear, onOpenVoice }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const prevMessageCount = useRef(messages.length);

  useLayoutEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  function handleSend() {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(txt);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function toggleMic() {
    if (!SR) { alert("Voice recognition requires Chrome or Edge."); return; }
    if (!micActive) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = true;
      r.lang = "en-US";
      r.onstart = () => setMicActive(true);
      r.onresult = (e: any) => {
        let f = "";
        for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) f += e.results[i][0].transcript;
        if (f) setInput(f);
      };
      r.onend = () => {
        setMicActive(false);
        if (input.trim()) handleSend();
      };
      recognitionRef.current = r;
      r.start();
      setTimeout(() => {
        r.stop();
      }, 8000);
    } else {
      recognitionRef.current?.stop();
    }
  }

  return (
    <div
      className="flex flex-col h-full rounded-[22px] overflow-hidden"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-[52px] h-[52px] shrink-0 cursor-pointer" onClick={onOpenVoice}>
            <div className="avatar-ring" />
            <AvatarSVG size={52} rounded="rect" />
          </div>
          <div>
            <div className="text-[15px] font-semibold">Sicero AI Concierge</div>
            <div className="flex items-center gap-1.5 text-[12px] mt-0.5" style={{ color: "#4ADE80" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online · Ready to assist
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <IconBtn title="Voice mode" onClick={onOpenVoice}>🎙</IconBtn>
          <IconBtn title="Clear chat" onClick={onClear}>↺</IconBtn>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 msg-in ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] shrink-0"
              style={msg.role === "ai"
                ? { background: "linear-gradient(135deg, var(--purple), #4533A0)", color: "#fff" }
                : { background: "var(--gold-dim)", border: "1px solid var(--border)", color: "var(--gold)", fontWeight: 700, fontSize: "11px" }
              }
            >
              {msg.role === "ai" ? "✦" : "You"}
            </div>
            <div className={`max-w-[78%] ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
              <div
                className="px-[15px] py-3 text-[13.5px] leading-[1.65]"
                style={msg.role === "ai"
                  ? {
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      borderRadius: "16px 16px 16px 4px",
                    }
                  : {
                      background: "linear-gradient(135deg,rgba(201,168,76,0.13),rgba(201,168,76,0.07))",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      borderRadius: "16px 16px 4px 16px",
                    }
                }
                {...(msg.html ? { dangerouslySetInnerHTML: { __html: msg.content } } : { children: msg.content })}
              />
              <div className={`text-[10.5px] mt-1.5 ${msg.role === "user" ? "text-right" : ""}`} style={{ color: "var(--text-muted)" }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5 msg-in">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[13px] shrink-0"
              style={{ background: "linear-gradient(135deg, var(--purple), #4533A0)", color: "#fff" }}>✦</div>
            <div
              className="flex gap-1 px-4 py-3 rounded-[16px] rounded-tl-[4px]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", width: "fit-content" }}
            >
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="px-[18px] py-2.5 flex gap-1.5 flex-wrap shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSend(chip)}
            className="px-3 py-1 rounded-full text-[11.5px] transition-all font-sans"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--gold)";
              el.style.color = "var(--gold)";
              el.style.background = "var(--gold-dim)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-subtle)";
              el.style.color = "var(--text-secondary)";
              el.style.background = "transparent";
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end px-4 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
          onKeyDown={handleKey}
          placeholder="Message..."
          rows={1}
          className="flex-1 rounded-xl px-[15px] py-[11px] text-[13.5px] font-sans resize-none outline-none transition-[border-color] overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            minHeight: "44px",
            maxHeight: "120px",
          }}
          onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)")}
          onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border-subtle)")}
        />

        <button
          onClick={toggleMic}
          title="Voice input"
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all text-lg shrink-0"
          style={micActive
            ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.5)", color: "#EF4444", animation: "micP 1s ease infinite" }
            : { border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }
          }
        >
          🎙
        </button>

        <button
          onClick={handleSend}
          className="w-11 h-11 flex items-center justify-center rounded-xl transition-all shrink-0"
          style={{ background: "linear-gradient(135deg, var(--gold), #9A6A2A)", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(201,168,76,0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="#050505">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-sm transition-all"
      style={{ border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-primary)";
        el.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.color = "var(--text-muted)";
        el.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
