"use client";

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

export default function LeftPanel({ query, status, onRestart, onStop, onRefine, refineChips = [], listening = false, processing = false, speaking = false, onOrbClick }) {
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
          <span className="quote-mark">&ldquo;</span>{query}<span className="quote-mark">&rdquo;</span>
        </div>
      )}

      {/* Small orb */}
      <div className="conv-orb-stage">
        <div
          className={`conv-orb${listening ? " listening" : ""}${processing ? " processing" : ""}${speaking ? " speaking" : ""}`}
          onClick={onOrbClick}
          title={processing ? "Processing…" : speaking ? "Pine is speaking" : listening ? "Stop listening" : "Tap to listen"}
        >
          <PineconeSVG />
        </div>

        <div className="orb-controls">
          <button className="ctrl-btn" onClick={onRestart}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Restart</span>
          </button>
          <div className="ctrl-sep" />
          <button className="ctrl-btn danger" onClick={onStop}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            <span>Stop</span>
          </button>
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
