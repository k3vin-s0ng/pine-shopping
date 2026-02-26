"use client"

import { History } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function header() {
    const router = useRouter()
    // useSession can return null session if auth fails, which is fine

    return (
       <header className="bg-black border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
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
                </div>
            </div>
        </header>
    )
}