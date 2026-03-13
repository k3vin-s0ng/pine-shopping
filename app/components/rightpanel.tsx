"use client";

import React from "react";
import type { RankedProduct } from "@/app/lib/products";

interface RightPanelProps {
  product?: RankedProduct | null;
}

export default function RightPanel({ product }: RightPanelProps) {
  if (!product) {
    return (
      <div className="h-full p-6 text-sm text-neutral-500">
        <h2 className="text-lg font-semibold mb-2">Product Details</h2>
        <p>Select a product to view more information.</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 border-l border-neutral-200 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="text-sm text-neutral-500">{product.cat}</p>
      </div>

      {/* Image */}
      <img
        src={product.img}
        alt={product.name}
        className="w-full h-48 object-cover rounded-lg"
      />

      {/* Description */}
      <p className="text-sm text-neutral-700 leading-relaxed">
        {product.desc}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-neutral-500">Price</div>
          <div className="font-medium">{product.price}</div>
        </div>

        <div>
          <div className="text-neutral-500">Rating</div>
          <div className="font-medium">
            ⭐ {product.rating} ({product.reviews})
          </div>
        </div>

        <div>
          <div className="text-neutral-500">Match</div>
          <div className="font-medium">{product.match}</div>
        </div>

        <div>
          <div className="text-neutral-500">Score</div>
          <div className="font-medium">{product.score.toFixed(2)}</div>
        </div>
      </div>

      {/* CTA */}
      <a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-black text-white py-2 rounded-lg hover:opacity-90 transition"
      >
        View Product
      </a>
    </div>
  );
}