"use client";
import { useState } from "react";

export default function Orb() {
  const [listening, setListening] = useState(false);

  const toggle = () => {
    setListening(true);
    setTimeout(() => setListening(false), 4000);
  };

  return (
    <div className="orb-wrap">
      <div className="orb-halo orb-halo-1"></div>
      <div className="orb-halo orb-halo-2"></div>

      <div className={`orb ${listening ? "listening" : ""}`} onClick={toggle}>
        <div className="waveform">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>
      </div>
    </div>
  );
}