"use client";

const NAV_TABS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
      </svg>
    ),
    label: "Explore",
    id: "explore",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    label: "Curated",
    id: "curated",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
    ),
    label: "Saved",
    id: "saved",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    label: "Profile",
    id: "profile",
  },
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
            {tab.icon}
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
        <svg style={{width:18,height:18,color:'white'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="8" y1="22" x2="16" y2="22"/>
        </svg>
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
        <button className="bar-send-btn" onClick={handleSend}>
          <svg style={{width:13,height:13,color:'white',marginLeft:1}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
