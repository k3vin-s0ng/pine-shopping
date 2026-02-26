"use client";

import { useAuth } from "@/app/lib/auth";

interface NavbarProps {
  onOpenAuth: (tab: "signin" | "signup") => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-white text-[17px]"
              style={{ background: "linear-gradient(135deg, var(--gold), var(--purple))" }}
            >
              ✦
            </div>
            <span className="font-display text-[22px] font-bold" style={{ color: "var(--gold)" }}>
              Sicero
            </span>
          </a>

          {/* Nav actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button onClick={logout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => onOpenAuth("signin")}>
                  Sign In
                </button>
                <button onClick={() => onOpenAuth("signup")}>
                  Get Started →
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}