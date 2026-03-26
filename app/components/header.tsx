"use client";

import { useAuth } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image"

interface NavbarProps {
  onOpenAuth: (tab: "signin" | "signup") => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] w-full"
      style={{
        background: "rgba(7,9,26,0.88)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-7xl mx-auto px-[40px] py-[18px] flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-[14px] no-underline">
            <Image className="" src="/logo.png" width={35} height={35} alt="logo" />
          <span className="font-display text-[22px] font-bold" style={{ color: "var(--gold)", letterSpacing: "0.5px" }}>
            Pine
          </span>
        </a>

        {/* Links */}
        <ul className="flex gap-16 list-none">
          {[
            { label: "How It Works", id: "how" },
            { label: "Categories", id: "categories" },
            { label: "Try Demo", id: "marketplace" },
            { label: "Reviews", id: "testimonials" },
          ].map(({ label, id }) => (
            <li key={id}>
              <button
                onClick={() => scrollTo(id)}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--gold)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Auth */}
        {user ? (
          <button
            onClick={() => { if (confirm("Sign out of Pine?")) logout(); }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all"
            style={{ border: "1px solid var(--border)", background: "var(--gold-dim)", cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.2)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--gold-dim)")}
          >
            <div
              className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--gold), var(--purple))" }}
            >
              {user.avatar}
            </div>
            <span className="text-[13px] font-semibold" style={{ color: "var(--gold)" }}>
              {user.name.split(" ")[0]}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>▾</span>
          </button>
        ) : (
          <div className="flex gap-4 items-center">
            <button
              onClick={() => onOpenAuth("signin")}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.color = "var(--gold)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth("signup")}
              className="px-[22px] py-2 rounded-full text-sm font-bold transition-all"
              style={{ background: "linear-gradient(135deg, var(--gold), #A8732E)", color: "#080808", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(201,168,76,0.35)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              Get Started →
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}