"use client";

import { useEffect, useRef } from "react";

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const colors = ["rgba(201,168,76,0.4)", "rgba(109,79,194,0.4)", "rgba(201,168,76,0.2)"];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      const s = Math.random() * 4 + 2;
      p.style.cssText = `width:${s}px;height:${s}px;background:${colors[i % 3]};left:${Math.random() * 100}%;animation-duration:${Math.random() * 12 + 10}s;animation-delay:${Math.random() * 10}s;`;
      hero.appendChild(p);
    }
    return () => hero.querySelectorAll(".particle").forEach((p) => p.remove());
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      ref={heroRef}
      className="min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ padding: "130px 40px 90px" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%,rgba(109,79,194,0.18) 0%,transparent 65%),radial-gradient(ellipse 60% 60% at 85% 90%,rgba(201,168,76,0.07) 0%,transparent 55%)",
        }}
      />

      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 relative"
        style={{
          border: "1px solid var(--border)",
          background: "var(--gold-dim)",
          color: "var(--gold-light)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--gold)" }} />
        AI-Powered · No More Endless Scrolling
      </div>

      {/* Heading */}
      <h1
        className="font-display font-bold leading-[1.08] max-w-[820px] mb-6 relative"
        style={{ fontSize: "clamp(44px, 6.5vw, 84px)" }}
      >
        The Marketplace<br />
        That <span className="grad-text">Listens to You</span>
      </h1>

      {/* Subtext */}
      <p
        className="text-lg max-w-[540px] leading-[1.75] mb-11 relative"
        style={{ color: "var(--text-secondary)" }}
      >
        Describe exactly what you need — budget, style, specs, vibes — and our AI concierge surfaces the perfect products and services in seconds.
      </p>

      {/* Actions */}
      <div className="flex gap-3.5 items-center relative">
        <button
          onClick={() => scrollTo("marketplace")}
          className="px-[34px] py-[15px] text-base rounded-xl font-semibold transition-all font-sans"
          style={{ background: "linear-gradient(135deg, var(--gold), #A8732E)", color: "#080808", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
        >
          Start Searching Free
        </button>
        <button
          onClick={() => scrollTo("how")}
          className="px-[34px] py-[15px] text-base rounded-xl font-medium transition-all font-sans"
          style={{ border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "var(--gold)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
        >
          See How It Works
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="relative mt-20 flex flex-col items-center gap-2">
        <div className="scroll-line" />
        <span className="text-[10px] tracking-[2px] uppercase" style={{ color: "var(--text-muted)" }}>Scroll to explore</span>
      </div>
    </section>
  );
}