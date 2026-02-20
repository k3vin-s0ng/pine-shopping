"use client";

import { useState } from "react";
import { Star, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Product } from "../data/mockProducts";

interface ProductCardProps {
  product: Product;
  onCompare: () => void;
  showCompare?: boolean;
}

export function ProductCard({ product, onCompare, showCompare = true }: ProductCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex gap-4">
        <img
          src={product.image}
          alt={product.title}
          className="w-24 h-24 object-cover rounded-md flex-shrink-0"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-medium text-base leading-snug">{product.title}</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-semibold">${product.price}</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{product.rating}</span>
              <span>({product.reviewCount.toLocaleString()} reviews)</span>
            </div>
            {product.isPrime && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                Prime
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Ships in {product.shippingEta}</p>
        </div>
      </div>

      <div className="text-sm">
        <span className="font-medium">Why recommended: </span>
        <span className="text-muted-foreground">{product.reason}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={product.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          View on Amazon
        </a>
        {showCompare && (
          <button
            onClick={onCompare}
            className="px-4 h-9 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
          >
            Compare
          </button>
        )}
        <button
          onClick={() => setEvidenceOpen(!evidenceOpen)}
          className="inline-flex items-center gap-1 px-4 h-9 border border-border rounded-md hover:bg-accent transition-colors text-sm"
        >
          Evidence
          {evidenceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {evidenceOpen && (
        <div className="border border-border rounded-md divide-y divide-border">
          {product.evidence.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 text-sm">
              {item.status === "fact" ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : item.status === "inferred" ? (
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="font-medium">{item.label}: </span>
                <span className="text-muted-foreground">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
