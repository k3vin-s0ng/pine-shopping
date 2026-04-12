"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InputBarProps = {
  interimValue?: string;
  micActive?: boolean;
  onSubmit?: (value: string) => void;
  isLoading?: boolean;
  clarificationQuestion?: string | null;
};

export default function InputBar({
  interimValue = "",
  micActive = false,
  onSubmit,
  isLoading = false,
  clarificationQuestion = null,
}: InputBarProps) {
  const [text, setText] = useState("");
  const router = useRouter();

  const inputDisplayValue = micActive ? interimValue : text;

  function handleSubmit() {
    const query = text.trim();
    if (!query || isLoading) return;

    if (onSubmit) {
      setText("");
      onSubmit(query);
    } else {
      router.push(`/conversation?q=${encodeURIComponent(query)}`);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!micActive) setText(e.target.value);
  }

  return (
    <div className="input-bar">
      <button
        className={`mic-btn-bar${micActive ? " active" : ""}`}
        disabled
        title={
          micActive
            ? "Listening…"
            : "Use the orb above to start voice input"
        }
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      </button>

      <div className="input-wrap">
        {clarificationQuestion && (
          <div className="clarification-bubble">
            {clarificationQuestion}
          </div>
        )}

        <input
          id="mainInput"
          className="main-input"
          value={inputDisplayValue}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={
            isLoading
              ? "Pine is thinking…"
              : clarificationQuestion
              ? "Type your answer…"
              : micActive
              ? "Listening…"
              : "Tell Pine what you're looking for…"
          }
          readOnly={micActive || isLoading}
        />

        <button
          className="send-btn"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="spin"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="bar-nav">
        <a href="/" className="bar-nav-item">
          <span>Home</span>
        </a>
        <a href="/cart" className="bar-nav-item">
          <span>Cart</span>
        </a>
        <a href="/account" className="bar-nav-item">
          <span>Account</span>
        </a>
      </div>
    </div>
  );
}