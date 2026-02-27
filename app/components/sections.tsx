"use client";

import React, { useEffect, useRef } from "react";

// ── TRUST BAR ──
export function TrustBar() {
  const items = [
    { num: "2.4M+", label: "Products Listed" },
    { num: "98%", label: "Match Accuracy" },
    { num: "320K", label: "Active Shoppers" },
    { num: "4.9★", label: "Avg. Rating" },
    { num: "42s", label: "Avg. Find Time" },
  ];
  return (
    <div
      className="flex items-center justify-center gap-16 px-[60px] py-7"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <div className="flex flex-col items-center gap-1">
            <div className="font-display text-[28px] font-bold leading-none" style={{ color: "var(--gold)" }}>{item.num}</div>
            <div className="text-[11px] uppercase tracking-[1px]" style={{ color: "var(--text-muted)" }}>{item.label}</div>
          </div>
          {i < items.length - 1 && <div className="w-px h-11" style={{ background: "var(--border-subtle)" }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── HOW IT WORKS ──
export function HowSection() {
  const steps = [
    { num: "01", icon: "💬", title: "Describe Your Need", desc: "Talk to Sicero by text or voice. Share requirements, budget, style, and deal-breakers in plain language." },
    { num: "02", icon: "🧠", title: "AI Searches Instantly", desc: "Sicero extracts your filters and surfaces real, purchasable products — no clarifying questions unless truly needed." },
    { num: "03", icon: "✦", title: "Buy With One Click", desc: "Click any result to go directly to the product page on Amazon or the brand's store. Real prices, real availability." },
  ];
  return (
    <section
      id="how"
      className="py-[110px] px-10"
      style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <SectionHead label="The Process" title={<>Shopping, <span className="grad-text">Reimagined</span></>} sub="No more endless scrolling. Just natural conversation and pinpoint results." />
      <div className="grid grid-cols-3 gap-7 max-w-[1020px] mx-auto">
        {steps.map((s, i) => (
          <StepCard key={s.num} {...s} delay={i * 0.1} />
        ))}
      </div>
    </section>
  );
}

function StepCard({ num, icon, title, desc, delay }: { num: string; icon: string; title: string; desc: string; delay: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="reveal relative overflow-hidden text-center rounded-[22px] p-9 transition-all duration-300 group"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", transitionDelay: `${delay}s` }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(201,168,76,0.22)";
        el.style.transform = "translateY(-5px)";
        el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.transform = "";
        el.style.boxShadow = "";
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: "linear-gradient(90deg, var(--gold), var(--purple))" }}
      />
      <div className="font-display text-[72px] font-bold leading-none mb-3" style={{ color: "rgba(255,255,255,0.05)" }}>{num}</div>
      <div className="text-[38px] mb-4">{icon}</div>
      <div className="text-[17px] font-semibold mb-2.5">{title}</div>
      <div className="text-[13.5px] leading-[1.65]" style={{ color: "var(--text-secondary)" }}>{desc}</div>
    </div>
  );
}

// ── FEATURES ──
export function FeaturesSection() {
  const features = [
    { icon: "🎯", title: "Precision Matching", desc: "Understands nuance — \"quiet gaming laptop for a library\" returns different results than \"performance gaming laptop.\"" },
    { icon: "🎙", title: "Voice Conversations", desc: "Talk hands-free. The AI avatar listens, understands, and speaks results back naturally — like a real shopping assistant." },
    { icon: "🛒", title: "Real Buy Links", desc: "Every product links directly to Amazon or brand stores with real pricing. No dead ends, no fake listings." },
    { icon: "⚡", title: "Instant Results", desc: "Results appear the moment you send. Refine with follow-ups like \"cheaper\" or \"show me black ones\" — it adapts immediately." },
    { icon: "💡", title: "Context Awareness", desc: "Sicero remembers the conversation. Refine, compare, and build on previous searches without starting over." },
    { icon: "🌐", title: "Goods & Services", desc: "Physical products, digital goods, freelance services, SaaS — Sicero covers every category in one place." },
  ];
  return (
    <section className="py-[110px] px-10">
      <SectionHead label="Why Sicero" title={<>Built for the Way <span className="grad-text">You Think</span></>} sub="Every feature designed to make discovery effortless and purchasing confident." />
      <div className="grid grid-cols-3 gap-5 max-w-[1080px] mx-auto">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="reveal rounded-[20px] p-[30px] transition-all duration-300"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", transitionDelay: `${delay}s` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-[18px]"
        style={{ background: "var(--gold-dim)", border: "1px solid var(--border)" }}
      >
        {icon}
      </div>
      <div className="text-base font-semibold mb-2.5">{title}</div>
      <div className="text-[13.5px] leading-[1.65]" style={{ color: "var(--text-secondary)" }}>{desc}</div>
    </div>
  );
}

// ── CATEGORIES ──
const CATS = [
  { icon: "💻", name: "Electronics", query: "electronics and gadgets" },
  { icon: "👗", name: "Fashion", query: "fashion and clothing" },
  { icon: "🏠", name: "Home & Living", query: "home and living products" },
  { icon: "💪", name: "Health & Fitness", query: "fitness and health gear" },
  { icon: "✨", name: "Beauty", query: "beauty and skincare products" },
  { icon: "✈️", name: "Travel", query: "travel bags and accessories" },
  { icon: "🎮", name: "Gaming", query: "gaming gear and accessories" },
  { icon: "📚", name: "Books & Learning", query: "books and educational resources" },
  { icon: "🐾", name: "Pets", query: "pet supplies" },
  { icon: "🍷", name: "Food & Drink", query: "food and gourmet products" },
  { icon: "🏕️", name: "Outdoor & Sports", query: "outdoor and sports equipment" },
  { icon: "💼", name: "Services", query: "professional services and SaaS tools" },
];

export function CategoriesSection({ onCategoryClick }: { onCategoryClick: (q: string) => void }) {
  return (
    <section id="categories" className="py-[110px] px-10">
      <SectionHead label="Browse by Category" title={<>Everything You <span className="grad-text">Could Need</span></>} sub="From cutting-edge tech to everyday essentials, Sicero has every category covered." />
      <div className="grid grid-cols-6 gap-3.5 max-w-[1140px] mx-auto">
        {CATS.map((cat) => {
          const ref = useReveal();
          return (
            <div
              key={cat.name}
              ref={ref}
              className="reveal py-7 px-3 text-center rounded-2xl cursor-pointer transition-all duration-300"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              onClick={() => { onCategoryClick(cat.query); document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" }); }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border)";
                el.style.background = "var(--bg-card-hover)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 8px 30px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border-subtle)";
                el.style.background = "var(--bg-card)";
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              <div className="text-[30px] mb-2.5">{cat.icon}</div>
              <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{cat.name}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── TESTIMONIALS ──
export function TestimonialsSection() {
  const tests = [
    { stars: 5, text: "I told Sicero I needed a laptop for 3D animation under $1,500 that stays cool. Within seconds — five perfect options with Amazon links. No more hours of research.", name: "James Nakamura", role: "3D Artist · Tokyo, Japan", initials: "J" },
    { stars: 5, text: "I used the voice feature and just talked to Sicero like a friend. It found exactly what I needed, the avatar even talked back. Then I clicked Buy — done.", name: "Sofia Andersson", role: "Nutritionist · Stockholm", initials: "S" },
    { stars: 5, text: "Niche B2B sourcing. Sicero understood my requirements instantly, linked me to real vendors — saved me literal weeks.", name: "Marcus Webb", role: "Founder · Austin, TX", initials: "M" },
  ];
  return (
    <section
      id="testimonials"
      className="py-[110px] px-10"
      style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <SectionHead label="Testimonials" title={<>Loved by <span className="grad-text">Thousands</span></>} sub="Real people. Real results." />
      <div className="grid grid-cols-3 gap-[22px] max-w-[1080px] mx-auto">
        {tests.map((t, i) => {
          const ref = useReveal();
          return (
            <div
              key={t.name}
              ref={ref}
              className="reveal rounded-[20px] p-7 transition-all duration-300"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", transitionDelay: `${i * 0.1}s` }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(201,168,76,0.2)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border-subtle)";
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >
              <div className="flex gap-0.5 mb-4">{"⭐".repeat(t.stars)}</div>
              <p className="text-[13.5px] leading-[1.75] mb-[22px] italic" style={{ color: "var(--text-secondary)" }}>&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--purple), var(--gold))" }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold">{t.name}</div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── CTA ──
export function CTASection({ onGetStarted: _onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-[130px] px-10 text-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(109,79,194,0.1) 0%,transparent 70%)" }}
      />
      <h2
        className="font-display font-bold mb-[18px] relative"
        style={{ fontSize: "clamp(34px, 5.5vw, 60px)" }}
      >
        Find Anything.<br />
        <span className="grad-text">Instantly.</span>
      </h2>
      <p
        className="text-lg mb-11 max-w-[480px] mx-auto relative leading-[1.65]"
        style={{ color: "var(--text-secondary)" }}
      >
        Join 320,000+ smart shoppers who&apos;ve discovered a better way to buy exactly what they need.
      </p>
      <button
        onClick={() => document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" })}
        className="px-[42px] py-4 text-base rounded-[14px] font-semibold transition-all relative font-sans"
        style={{ background: "linear-gradient(135deg, var(--gold), #A8732E)", color: "#080808", border: "none", cursor: "pointer" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
      >
        Try Sicero — It&apos;s Free
      </button>
    </section>
  );
}

// ── FOOTER ──
export function Footer() {
  return (
    <footer
      className="px-[60px] pt-16 pb-8"
      style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="grid gap-12 mb-[52px]" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-white text-[17px]"
              style={{ background: "linear-gradient(135deg, var(--gold), var(--purple))" }}
            >✦</div>
            <span className="font-display text-[22px] font-bold" style={{ color: "var(--gold)" }}>Sicero</span>
          </div>
          <p className="text-[13.5px] leading-[1.75] max-w-[260px]" style={{ color: "var(--text-muted)" }}>
            The world&apos;s first AI-powered conversational marketplace. Find anything, fast — just by talking.
          </p>
          <div className="flex gap-2.5 mt-5">
            {["𝕏", "in", "ig", "gh"].map((s) => (
              <a
                key={s}
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-[9px] text-sm transition-all no-underline"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "var(--gold)"; (e.currentTarget as HTMLElement).style.background = "var(--gold-dim)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
        {[
          { title: "Product", links: ["Features", "Pricing", "API Access", "Changelog"] },
          { title: "Company", links: ["About Us", "Blog", "Careers", "Contact"] },
          { title: "Legal", links: ["Privacy Policy", "Terms", "Security"] },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-[11px] font-bold uppercase tracking-[1.2px] mb-[18px]" style={{ color: "var(--text-secondary)" }}>{col.title}</h4>
            <ul className="flex flex-col gap-3 list-none">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-[13.5px] transition-colors no-underline"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--gold)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between pt-7"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>© 2026 Sicero Inc. All rights reserved.</p>
        <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
          Built with <span style={{ color: "var(--gold)" }}>✦</span> and intelligence
        </p>
      </div>
    </footer>
  );
}

// ── SHARED ──
function SectionHead({ label, title, sub }: { label: string; title: React.ReactNode; sub: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal text-center mb-14">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: "var(--gold)" }}>{label}</div>
      <h2 className="font-display font-bold leading-[1.15] mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>{title}</h2>
      <p className="text-base max-w-[500px] mx-auto leading-[1.65]" style={{ color: "var(--text-secondary)" }}>{sub}</p>
    </div>
  );
}

// ── REVEAL HOOK ──
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
