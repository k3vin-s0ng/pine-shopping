"use client";

import { Product } from "@/app/lib/products";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3.5 p-3.5 rounded-[14px] cursor-pointer transition-all duration-[220ms] msg-in no-underline"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        color: "inherit",
        display: "flex",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(201,168,76,0.22)";
        el.style.background = "var(--bg-card-hover)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.background = "var(--bg-card)";
        el.style.transform = "";
        el.style.boxShadow = "";
      }}
    >
      {/* Image */}
      <div
        className="w-[72px] h-[72px] rounded-[10px] flex items-center justify-center text-2xl shrink-0 overflow-hidden"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
      >
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover rounded-[9px]"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.textContent = "🛍️";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[9.5px] font-bold uppercase tracking-[1px] mb-0.5" style={{ color: "var(--purple-light)" }}>
          {product.cat}
        </div>
        <div className="text-[13.5px] font-semibold truncate mb-0.5">{product.name}</div>
        <div
          className="text-[11.5px] leading-[1.5]"
          style={{
            color: "var(--text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.desc}
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-1.5">
          <span className="font-display text-[17px] font-bold" style={{ color: "var(--gold)" }}>
            {product.price}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--gold)", fontSize: "10px" }}>★</span>
              {product.rating} ({product.reviews})
            </div>
            <span
              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(74,222,128,0.1)",
                color: "#4ADE80",
                border: "1px solid rgba(74,222,128,0.2)",
              }}
            >
              {product.match}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => window.open(product.link, "_blank", "noopener")}
            className="px-3 py-1.5 rounded-[7px] text-[10.5px] font-bold transition-all font-sans"
            style={{ background: "linear-gradient(135deg, var(--gold), #9A6A2A)", color: "#060606", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 12px rgba(201,168,76,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            Buy Now →
          </button>
          <button
            onClick={() => onViewDetails?.(product)}
            className="px-3 py-1.5 rounded-[7px] text-[10.5px] font-semibold transition-all font-sans"
            style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--gold)", cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--gold-dim)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            Details
          </button>
        </div>
      </div>
    </a>
  );
}