"use client";

interface AvatarSVGProps {
  size?: number;
  rounded?: "circle" | "rect";
  state?: "idle" | "speaking" | "listening";
  className?: string;
}

export default function AvatarSVG({
  size = 52,
  rounded = "rect",
  state = "idle",
  className = "",
}: AvatarSVGProps) {
  const rx = rounded === "rect" ? "14" : `${size / 2}`;
  const isCircle = rounded === "circle";
  const glowColor =
    state === "speaking"
      ? "drop-shadow(0 0 20px rgba(201,168,76,0.6)) drop-shadow(0 0 40px rgba(201,168,76,0.3))"
      : state === "listening"
      ? "drop-shadow(0 0 20px rgba(74,222,128,0.5))"
      : "drop-shadow(0 0 20px rgba(109,79,194,0.5)) drop-shadow(0 0 40px rgba(201,168,76,0.2))";

  const eyeFill = state === "listening" ? "#4ADE80" : "rgba(255,255,255,0.9)";

  // Scale coordinates based on size
  const s = size / 52;
  const cx = 26 * s;
  const cy = 26 * s;

  if (isCircle) {
    // Larger modal version
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: glowColor }}
        className={`${state === "idle" ? "animate-[orbFloat_4s_ease-in-out_infinite]" : ""} ${className}`}
      >
        <defs>
          <radialGradient id="orbGradModal" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9B7FE8" />
            <stop offset="50%" stopColor="#6D4FC2" />
            <stop offset="100%" stopColor="#3D2A90" />
          </radialGradient>
          <radialGradient id="glowGradModal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,168,76,0.3)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0)" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#orbGradModal)" />
        <circle cx="60" cy="60" r="56" fill="url(#glowGradModal)" opacity="0.6" />
        <ellipse cx="44" cy="38" rx="14" ry="9" fill="rgba(255,255,255,0.12)" transform="rotate(-20,44,38)" />
        <ellipse className="eye-l" cx="42" cy="52" rx="5.5" ry="6.5" fill={eyeFill} />
        <ellipse className="eye-r" cx="78" cy="52" rx="5.5" ry="6.5" fill={eyeFill} />
        <circle cx="43" cy="53" r="2.5" fill="#1a1a3e" />
        <circle cx="79" cy="53" r="2.5" fill="#1a1a3e" />
        <circle cx="44.5" cy="51" r="1" fill="rgba(255,255,255,0.8)" />
        <circle cx="80.5" cy="51" r="1" fill="rgba(255,255,255,0.8)" />
        <path
          className={state === "speaking" ? "mouth-path" : ""}
          d="M42,74 Q60,86 78,74"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <text x="60" y="24" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.7)">✦</text>
      </svg>
    );
  }

  // Smaller header version
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: glowColor }}
      className={`rounded-[14px] overflow-hidden ${className}`}
    >
      <defs>
        <radialGradient id="hGradHeader" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#9B7FE8" />
          <stop offset="100%" stopColor="#3D2A90" />
        </radialGradient>
      </defs>
      <rect width="52" height="52" rx="14" fill="url(#hGradHeader)" />
      <ellipse className="eye-l" cx="19" cy="22" rx="4" ry="5" fill={eyeFill} />
      <ellipse className="eye-r" cx="33" cy="22" rx="4" ry="5" fill={eyeFill} />
      <circle cx="19.5" cy="22.5" r="1.8" fill="#1a1a3e" />
      <circle cx="33.5" cy="22.5" r="1.8" fill="#1a1a3e" />
      <path
        d="M17,33 Q26,39 35,33"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <text x="26" y="11" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.6)">✦</text>
    </svg>
  );
}