"use client";
import { useState } from "react";

export default function InputBar() {
  const [text, setText] = useState("");

  return (
    <div className="input-bar">
      <button className="mic-btn-bar">🎤</button>

      <div className="input-wrap">
        <input
          className="main-input"
          value={text}
          onChange={(e)=>setText(e.target.value)}
          placeholder="Tell Pine what you're looking for…"
        />
        <button className="send-btn">➤</button>
      </div>
    </div>
  );
}