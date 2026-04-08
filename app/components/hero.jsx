"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Orb from "./orb";

export default function Hero({ onComplete, onInterimTranscript, onListeningChange }) {
  const router = useRouter();
  const [pineResponse, setPineResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const wordTimerRef = useRef(null);
  const cycleTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const hasStartedRef = useRef(false);

  const PLACEHOLDERS = ["Thinking...", "Searching...", "Curating...", "Sourcing...", "Discovering...", "Exploring...", "Refining...", "Handpicking..."];

  function stopCycling() {
    clearInterval(cycleTimerRef.current);
    clearTimeout(fadeTimerRef.current);
    cycleTimerRef.current = null;
    fadeTimerRef.current = null;
  }

  function startCycling() {
    hasStartedRef.current = true;
    setPineResponse("");
    setIsProcessing(true);
    setPlaceholderIndex(0);
    setPlaceholderVisible(true);

    let idx = 0;
    cycleTimerRef.current = setInterval(() => {
      // Fade out
      setPlaceholderVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        idx = (idx + 1) % PLACEHOLDERS.length;
        setPlaceholderIndex(idx);
        // Fade in
        setPlaceholderVisible(true);
      }, 300); // matches CSS transition duration
    }, 1500); // each placeholder shows for 1.5s
  }

  function animateResponse(text) {
    // Stop cycling and clear any in-progress word animation
    stopCycling();
    setIsProcessing(false);
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    setPineResponse("");

    const words = text.trim().split(" ");
    let i = 0;
    // Interval starts when called — onPineResponse fires only after audio.play() resolves in inworldTTS.ts
    wordTimerRef.current = setInterval(() => {
      i++;
      setPineResponse(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
      }
    }, 200); // ~200ms per word
  }

  function sendChip(text) {
    router.push(`/conversation?q=${encodeURIComponent(text)}`);
  }
  return (
    <section className="hero">
      <div className="hero-bloom"></div>

      <p className="hero-title">Hello, I'm <em>Pine.</em></p>
      <p className="hero-sub">How can I curate your world today?</p>

      <div className="orb-stage">

        {/* Left category column */}
        <div className="cat-col" style={{ opacity: 0, animation: "fadeUp 0.7s ease forwards 0.65s" }}>
          <div className="cat-node" onClick={() => sendChip("Show me new arrivals in style")}>
            <div className="cat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </div>
            <span className="cat-label">Style</span>
          </div>
          <div className="cat-node" onClick={() => sendChip("Find something for my wellness routine")}>
            <div className="cat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <span className="cat-label">Wellness</span>
          </div>
        </div>
 
        {/* Center orb */}
        <Orb onComplete={onComplete} onInterimTranscript={onInterimTranscript} onListeningChange={onListeningChange} onPineResponse={animateResponse} onProcessingStart={startCycling} isProcessing={isProcessing} />

        {/* Right category column */}
        <div className="cat-col" style={{ opacity: 0, animation: "fadeUp 0.7s ease forwards 0.65s" }}>
          <div className="cat-node" onClick={() => sendChip("Help me find something beautiful for my home")}>
            <div className="cat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="cat-label">Home</span>
          </div>
          <div className="cat-node" onClick={() => sendChip("Explore lifestyle and living essentials")}>
            <div className="cat-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <span className="cat-label">Lifestyle</span>
          </div>
        </div>

      </div>

      {/* CTA text below orb — cycles placeholders while processing, then animates Pine's response */}
      <div className="orb-cta">
        <h2
          className="orb-cta-h2"
          style={{ opacity: isProcessing ? (placeholderVisible ? 1 : 0) : 1 }}
        >
          <em>
            {pineResponse
              ? pineResponse
              : isProcessing
              ? PLACEHOLDERS[placeholderIndex]
              : hasStartedRef.current
              ? "\u00A0"
              : "Just start talking to Pine"}
          </em>
        </h2>
        <p>{pineResponse || isProcessing || hasStartedRef.current ? "\u00A0" : "\u201CFind me a linen shirt for a weekend escape...\u201D"}</p>
      </div>

      {/* Prompt chips */}
      <div className="prompt-chips">
        {[
          "Something for a weekend trip",
          "A gift under $200",
          "Refresh my wardrobe",
          "Quiet luxury essentials",
          "Something for the home",
        ].map((chip) => (
          <span key={chip} className="chip" onClick={() => sendChip(chip)}>
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}