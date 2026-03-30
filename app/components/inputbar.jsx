"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InputBar() {
  const [text, setText] = useState("");
  const router = useRouter();

  function handleSubmit() {
    if (!text.trim()) return;
    router.push(`/conversation?q=${encodeURIComponent(text.trim())}`);
  }

  return (
    <div className="input-bar">
      <button className="mic-btn-bar">🎤</button>

      <div className="input-wrap">
        <input
          className="main-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tell Pine what you're looking for…"
        />
        <button className="send-btn" onClick={handleSubmit}>➤</button>
      </div>
    </div>
  );
}
