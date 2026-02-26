"use client";

import { useState, useCallback, useRef } from "react";
import { AuthProvider, useAuth } from "@/app/lib/auth";
import { Product } from "@/app/lib/products";
import Navbar from "@/app/components/header";
import AuthModal from "@/app/components/AuthModal";
import VoiceModal from "@/app/components/VoiceModal";
import Hero from "@/app/components/Hero";
import { TrustBar, HowSection, FeaturesSection, CategoriesSection, TestimonialsSection, CTASection, Footer } from "@/app/components/Sections";
import ChatPanel from "@/app/components/ChatPanel";
import ResultsPanel from "@/app/components/ResultsPanel"
import { useChat } from "@/app/lib/useChat";

function SiceroApp() {
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

  function openAuth(tab: "signin" | "signup") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function handleAuthSuccess(name: string, isNew: boolean) {
    const first = name.split(" ")[0];
    if (isNew) {
      addAIMessage(`Welcome to Sicero, <strong>${first}</strong>! 🎉 I'm your personal shopping concierge. What are you looking for today?`, true);
    } else {
      addAIMessage(`Welcome back, <strong>${first}</strong>! What can I find for you today? 😊`, true);
    }
  }

  function handleVoiceResult(text: string) {
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
    processMessage(text);
  }

  function handleCategoryClick(query: string) {
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
    processMessage(query);
  }

  function handleViewDetails(product: Product) {
    addAIMessage(
      `Here's a quick summary of <strong>${product.name}</strong>. <a href="${product.link}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline">View full listing →</a><br/><br/>Want me to find cheaper alternatives, a different brand, or compare this to something specific?`,
      true
    );
  }

  return (
    <>
      <Navbar onOpenAuth={openAuth} />

      <AuthModal
        open={authOpen}
        defaultTab={authTab}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <VoiceModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={handleVoiceResult}
      />

      <main>
        <Hero onGetStarted={() => openAuth("signup")} />
        <TrustBar />

        {/* Marketplace */}
        <section id="marketplace" className="py-[100px] px-10 max-w-[1320px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-[10px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: "var(--gold)" }}>Live Demo</div>
            <h2 className="font-display font-bold leading-[1.15] mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
              Talk to <span className="grad-text">Sicero</span>
            </h2>
            <p className="text-base max-w-[500px] mx-auto leading-[1.65]" style={{ color: "var(--text-secondary)" }}>
              Describe exactly what you want. Our AI listens, understands, and delivers real products with real buying links — instantly.
            </p>
          </div>
          <div className="grid gap-5 min-h-[700px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <ChatPanel
              messages={messages}
              isTyping={isTyping}
              onSend={processMessage}
              onClear={clearChat}
              onOpenVoice={() => setVoiceOpen(true)}
            />
            <ResultsPanel
              products={products}
              allProducts={allProducts}
              isSearching={isSearching}
              onFilter={filterProducts}
              onViewDetails={handleViewDetails}
            />
          </div>
        </section>

        <HowSection />
        <FeaturesSection />
        <CategoriesSection onCategoryClick={handleCategoryClick} />
        <TestimonialsSection />
        <CTASection onGetStarted={() => openAuth("signup")} />
      </main>

      <Footer />
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <SiceroApp />
    </AuthProvider>
  );
}