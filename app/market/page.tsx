"use client"

import { useState, useEffect } from "react"
import ChatPanel from "@/app/components/chatpanel"
import { Product } from "@/app/lib/products";
import { useChat } from "@/app/lib/useChat";
import ResultsPanel from "@/app/components/resultspanel"
import RightPanel from "@/app/components/rightpanel"


export default function Page() {
    const [voiceOpen, setVoiceOpen] = useState(false);
    const {
        messages,
        products,
        allProducts,
        isTyping,
        isSearching,
        processMessage,
        filterProducts,
        clearChat,
        addAIMessage,
      } = useChat();

  const [insightIndex, setInsightIndex] = useState(0)

  const INSIGHTS = [
    "📉 MacBook Pro dropped $300 — lowest in 90 days",
    "⚡ 3 items on your list are rising in price",
    "🎯 Best time to buy laptops: right now",
    "💡 Dell XPS open-box saves $250 same warranty",
  ]

  function handleViewDetails(product: Product) {
      addAIMessage(
        `Here's a quick summary of <strong>${product.name}</strong>. <a href="${product.link}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline">View full listing →</a><br/><br/>Want me to find cheaper alternatives, a different brand, or compare this to something specific?`,
        true
      );
    }


  return (
    <div className="flex h-screen flex-col bg-[#080a1a] text-white overflow-hidden">

      {/* NAVBAR */}
      <header className="h-[58px] flex items-center justify-between px-7 border-b border-white/5 backdrop-blur-xl bg-[#080a1a]/95 z-50">

        {/* LEFT */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm">
            ✦
          </div>

          <span className="font-bold text-lg font-syne">
            Sicero
          </span>

          <span className="ml-2 text-[10px] font-bold tracking-widest text-[#D4AF37] px-2 py-[2px] rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            MARKETPLACE
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          <button className="px-4 py-1.5 rounded-md text-sm font-semibold bg-gradient-to-br from-[#D4AF37] to-[#B8960C] text-black">
            Sign In
          </button>

        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT CHAT */}
        <aside className="w-[300px] border-r border-white/5 bg-gradient-to-b from-[#0a0c1c] to-[#080a16]">
          <ChatPanel
            messages={messages}
            isTyping={isTyping}
            onSend={processMessage}
            onClear={clearChat}
            onOpenVoice={() => setVoiceOpen(true)}
        />
        </aside>

        {/* CENTER MARKET GRID */}
        <main className="flex-1 overflow-y-auto p-6">
            <ResultsPanel
                products={products}
                allProducts={allProducts}
                isSearching={isSearching}
                onFilter={filterProducts}
                onViewDetails={handleViewDetails}
            />
        </main>

        {/* RIGHT MARKET INTELLIGENCE */}
        <aside className="w-[268px] border-l border-white/5 overflow-y-auto p-4 bg-gradient-to-b from-[#0a0c1c] to-[#080a16]">
            <RightPanel/>
        </aside>

      </div>
    </div>
  )
}