"use client";

import { useState } from "react";
import { Product } from "@/app/lib/products";
import ProductCard from "./market";

interface ResultsPanelProps {
  products: Product[];
  allProducts: Product[];
  isSearching: boolean;
  onFilter: (mode: "top" | "all" | "low" | "high") => void;
  onViewDetails: (product: Product) => void;
}

type FilterMode = "top" | "all" | "low" | "high";

export default function ResultsPanel({
  products,
  allProducts,
  isSearching,
  onFilter,
  onViewDetails,
}: ResultsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterMode>("top");

  function handleFilter(mode: FilterMode) {
    setActiveFilter(mode);
    onFilter(mode);
  }

  const countLabel =
    allProducts.length > 3 && activeFilter === "top"
      ? `3 of ${allProducts.length}`
      : `${products.length} found`;

  return (
    <div
      className="flex flex-col rounded-[22px] overflow-hidden"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[14.5px] font-semibold">Curated Results</span>
            <span
              className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--gold-dim)", border: "1px solid var(--border)", color: "var(--gold)" }}
            >
              {countLabel}
            </span>
          </div>
          <div className="flex gap-1.5">
            {(["top", "all", "low", "high"] as FilterMode[]).map((mode) => {
              const label = mode === "top" ? "Top Match" : mode === "all" ? "All Results" : mode === "low" ? "Price ↑" : "Price ↓";
              return (
                <button
                  key={mode}
                  onClick={() => handleFilter(mode)}
                  className="px-2.5 py-1 rounded-[6px] text-[11px] transition-all font-sans"
                  style={activeFilter === mode
                    ? { border: "1px solid var(--gold)", color: "var(--gold)", background: "var(--gold-dim)", cursor: "pointer" }
                    : { border: "1px solid var(--border-subtle)", color: "var(--text-muted)", background: "transparent", cursor: "pointer" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
        {isSearching && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl msg-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-[18px] h-[18px] rounded-full shrink-0"
              style={{
                border: "2px solid var(--border)",
                borderTopColor: "var(--gold)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
              Searching catalog for best matches…
            </span>
          </div>
        )}

        {!isSearching && products.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-10">
            <div className="text-[44px] mb-4 opacity-35">✦</div>
            <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Start a conversation
            </h3>
            <p className="text-[13px] leading-[1.6] max-w-[250px]" style={{ color: "var(--text-muted)" }}>
              Real product recommendations with live buy links will appear here as you chat.
            </p>
          </div>
        )}

        {products.map((product) => (
          <ProductCard key={product.name + product.price} product={product} onViewDetails={onViewDetails} />
        ))}
      </div>
    </div>
  );
}