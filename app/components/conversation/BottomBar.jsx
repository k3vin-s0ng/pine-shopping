"use client";

const NAV_TABS = [
  { icon: "🔍", label: "Explore", id: "explore" },
  { icon: "✦", label: "Curated", id: "curated" },
  { icon: "♡", label: "Saved",   id: "saved"   },
  { icon: "◯", label: "Profile", id: "profile" },
];

export default function BottomBar({ onSubmit, onMicClick, micActive, inputValue, setInputValue }) {
  function handleKeyDown(e) {
    if (e.key === "Enter" && inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  }

  function handleSend() {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  }

  return (
    <div className="conv-bottom-bar">
      {/* Bottom nav tabs — visual only for now, no routing */}
      <div className="conv-nav-tabs">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`conv-nav-tab${tab.id === "explore" ? " active" : ""}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bar-sep" />

      {/* Mic button — TODO E1: Wire to Web Speech API — transcript feeds handleSubmit */}
      <button
        className={`bar-mic-btn${micActive ? " active" : ""}`}
        onClick={onMicClick}
        title={micActive ? "Stop listening" : "Start voice input"}
      >
        🎤
      </button>

      {/* Text input */}
      <div className="bar-input-wrap">
        <input
          className="bar-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Refine your search or ask Pine something new…"
        />
        <button className="bar-send-btn" onClick={handleSend}>➤</button>
      </div>
    </div>
  );
}
