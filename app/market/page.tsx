"use client"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/app/lib/auth";
import ChatPanel from "@/app/components/chatpanel"
import { Product } from "@/app/lib/products";
import { useChat } from "@/app/lib/useChat";
import ResultsPanel from "@/app/components/resultspanel"
import RightPanel from "@/app/components/rightpanel"
import Navbar from "@/app/components/generalheader";


function MarketPlace() {
    const { user } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
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

    function openAuth(tab: "signin" | "signup") {
        setAuthTab(tab);
        setAuthOpen(true);
    }

    function handleViewDetails(product: Product) {
        addAIMessage(
            `Here's a quick summary of <strong>${product.name}</strong>. <a href="${product.link}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline">View full listing →</a><br/><br/>Want me to find cheaper alternatives, a different brand, or compare this to something specific?`,
            true
        );
    }


    return (
        <div className="relative h-screen bg-[#080a1a] text-white">
            {/* HEADER (fixed) */}
            <header className="fixed top-0 left-0 w-full z-50">
                <Navbar onOpenAuth={openAuth} />
            </header>

            {/* BODY */}
            <div className="flex h-screen pt-[64px] overflow-hidden">
                {/* LEFT CHAT */}
                <aside className="w-[300px] border-r border-white/5 bg-gradient-to-b from-[#0a0c1c] to-[#080a16] overflow-y-auto">
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
                    <RightPanel />
                </aside>
            </div>
        </div>
    )
}

export default function Page() {
    return (
        <AuthProvider>
            <MarketPlace />
        </AuthProvider>
    );
}