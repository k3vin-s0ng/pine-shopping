"use client"

import type React from "react"
import Link from "next/link"
import { Instagram, Mail } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-white via-slate-100 to-slate-300">
      {/* soft top separator (not a hard line) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/70 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center pb-2">
            <Image src="/logo.png" width={26} height={26} alt="DebatePal logo" />
            <h3 className="text-2xl font-bold mx-4 text-slate-900">DebatePal</h3>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-700">

            <Instagram className="text-[#066bc0]" />
            <p>Follow Us:</p>
            <Link
              className="text-[#066bc0] hover:text-blue-800 font-semibold transition-colors"
              href="https://www.instagram.com/debatepalai/"
              target="_blank"
            >
              @debatepalai
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-2 text-center text-slate-600">
          © {new Date().getFullYear()} DebatePal. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
