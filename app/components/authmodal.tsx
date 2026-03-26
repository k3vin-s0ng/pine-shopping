"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/auth";

interface AuthModalProps {
  open: boolean;
  defaultTab?: "signin" | "signup";
  onClose: () => void;
  onSuccess: (name: string, isNew: boolean) => void;
}

export default function AuthModal({ open, defaultTab = "signin", onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const res = login(siEmail, siPass);
    if (res.error) { setError(res.error); return; }
    setError("");
    onClose();
    onSuccess(siEmail, false);
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const res = register(suName, suEmail, suPass);
    if (res.error) { setError(res.error); return; }
    setError("");
    onClose();
    onSuccess(suName, true);
  }

  function switchTab(t: "signin" | "signup") {
    setTab(t);
    setError("");
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(7,9,26,0.9)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[420px] mx-4 rounded-3xl p-10"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all"
          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; }}
        >
          ✕
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, var(--gold), var(--purple))" }}>✦</div>
          <span className="font-display text-lg font-bold" style={{ color: "var(--gold)" }}>Pine</span>
        </div>

        {/* Tabs */}
        <div className="flex rounded-[10px] p-0.5 mb-7" style={{ border: "1px solid var(--border-subtle)" }}>
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex-1 py-2 rounded-lg text-[13.5px] font-medium transition-all font-sans"
              style={tab === t ? {
                background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--border)"
              } : { background: "transparent", color: "var(--text-muted)", border: "1px solid transparent" }}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            <Field label="Email">
              <input className="auth-input" value={siEmail} onChange={e => setSiEmail(e.target.value)} type="email" placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input className="auth-input" value={siPass} onChange={e => setSiPass(e.target.value)} type="password" placeholder="Your password" required />
            </Field>
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
            <SubmitBtn>Sign In →</SubmitBtn>
            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => switchTab("signup")} style={{ color: "var(--gold)" }}>Create one free</button>
            </p>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3.5">
            <Field label="Full Name">
              <input className="auth-input" value={suName} onChange={e => setSuName(e.target.value)} type="text" placeholder="Jane Smith" required />
            </Field>
            <Field label="Email">
              <input className="auth-input" value={suEmail} onChange={e => setSuEmail(e.target.value)} type="email" placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input className="auth-input" value={suPass} onChange={e => setSuPass(e.target.value)} type="password" placeholder="Min. 6 characters" required minLength={6} />
            </Field>
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>}
            <SubmitBtn>Create Account →</SubmitBtn>
            <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <button type="button" onClick={() => switchTab("signin")} style={{ color: "var(--gold)" }}>Sign in</button>
            </p>
          </form>
        )}
      </div>

      <style jsx>{`
        .auth-input {
          width: 100%;
          padding: 11px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          font-family: var(--font-inter), sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus { border-color: rgba(201,168,76,0.4); }
        .auth-input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-1 py-3 rounded-[10px] text-sm font-bold transition-all font-sans"
      style={{ background: "linear-gradient(135deg, var(--gold), #A8732E)", color: "#080808", border: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(201,168,76,0.35)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
    >
      {children}
    </button>
  );
}
