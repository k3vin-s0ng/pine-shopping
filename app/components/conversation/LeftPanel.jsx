"use client";
import { useState } from "react";

const PineconeSVG = () => (
  <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="33" width="4" height="3" rx="2" fill="rgba(255,255,255,0.45)" />
    <ellipse cx="14" cy="30" rx="7"   ry="3.2" fill="rgba(255,255,255,0.42)" />
    <ellipse cx="14" cy="24" rx="8"   ry="3.4" fill="rgba(255,255,255,0.48)" />
    <ellipse cx="14" cy="18" rx="7"   ry="3.2" fill="rgba(255,255,255,0.54)" />
    <ellipse cx="14" cy="13" rx="5.5" ry="3"   fill="rgba(255,255,255,0.60)" />
    <ellipse cx="14" cy="8"  rx="4"   ry="3"   fill="rgba(255,255,255,0.66)" />
    <ellipse cx="14" cy="4"  rx="2.5" ry="2.5" fill="rgba(255,255,255,0.72)" />
  </svg>
);

export default function LeftPanel({ query, status, onRestart, onStop, onRefine, refineChips = [] }) {
  const [listening, setListening] = useState(false);

  function toggleListening() {
    setListening((l) => !l);
  }

  return (
    <aside className="conv-left">
      {/* Status */}
      <div className="status-row">
        <div className="status-dot" />
        <span className="status-label">{status}</span>
      </div>

      {/* Query echo */}
      {query && (
        <div className="query-echo">
          &ldquo;{query}&rdquo;
        </div>
      )}

      {/* Small orb */}
      <div className="conv-orb-stage">
        <div
          className={`conv-orb${listening ? " listening" : ""}`}
          onClick={toggleListening}
          title={listening ? "Stop listening" : "Tap to listen"}
        >
          <PineconeSVG />
        </div>

        <div className="orb-controls">
          <button className="restart-btn" onClick={onRestart}>↺ Restart</button>
          <button className="stop-btn" onClick={onStop}>■ Stop</button>
        </div>
      </div>

      {/* Refine chips */}
      {refineChips.length > 0 && (
        <div className="refine-section">
          <span className="refine-section-label">Refine</span>
          <div className="refine-chips">
            {refineChips.map((chip) => (
              <button key={chip} className="chip" onClick={() => onRefine(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
