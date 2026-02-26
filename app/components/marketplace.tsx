"use client";

import ChatPanel from "./chatpanel";
import ResultsPanel from "./resultspanel";
import { useChat } from "@/app/lib/useChat";
import { Product } from "@/app/lib/products";

interface MarketplaceSectionProps {
  onOpenVoice: () => void;
  onViewDetails: (product: Product) => void;
  externalMessage?: string;
  onExternalMessageConsumed?: () => void;
}

export default function MarketplaceSection({
  onOpenVoice,
  onViewDetails,
  externalMessage,
  onExternalMessageConsumed,
}: MarketplaceSectionProps) {
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

  // Handle external messages (from category clicks or voice modal)
  if (externalMessage) {
    processMessage(externalMessage);
    onExternalMessageConsumed?.();
  }

  function handleViewDetails(product: Product) {
    addAIMessage(
      `Here's a quick summary of <strong>${product.name}</strong>. <a href="${product.link}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline">View full listing →</a><br/><br/>Want me to find cheaper alternatives, a different brand, or compare this to something specific?`,
      true
    );
    onViewDetails(product);
  }

  return (
    <section id="marketplace" className="py-[100px] px-10 max-w-[1320px] mx-auto">
      <div className="text-center mb-14 reveal">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: "var(--gold)" }}>Live Demo</div>
        <h2 className="font-display font-bold leading-[1.15] mb-3.5" style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
          Talk to <span className="grad-text">Sicero</span>
        </h2>
        <p className="text-base max-w-[500px] mx-auto leading-[1.65]" style={{ color: "var(--text-secondary)" }}>
          Describe exactly what you want. Our AI listens, understands, and delivers real products with real buying links — instantly.
        </p>
      </div>

      <div className="grid gap-5.5 min-h-[700px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <ChatPanel
          messages={messages}
          isTyping={isTyping}
          onSend={processMessage}
          onClear={clearChat}
          onOpenVoice={onOpenVoice}
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
  );
}