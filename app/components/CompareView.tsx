"use client";

import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { Product } from "../data/mockProducts";

interface CompareViewProps {
  products: Product[];
  onBack: () => void;
}

export function CompareView({ products, onBack }: CompareViewProps) {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Results
        </button>

        <h2 className="text-2xl font-semibold mb-6">Compare top matches</h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-border rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Prime</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Shipping</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Key Features</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="bg-card hover:bg-accent/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded flex-shrink-0"
                      />
                      <span className="font-medium max-w-[180px] leading-snug">{product.title}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold">${product.price}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                      <span className="text-muted-foreground text-xs">({product.reviewCount.toLocaleString()})</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.isPrime ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Prime</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{product.shippingEta}</td>
                  <td className="p-4">
                    <ul className="space-y-1 text-muted-foreground">
                      {product.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-xs">• {f}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4">
                    <a
                      href={product.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 h-8 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          Products were selected based on your specific requirements, customer ratings, price-to-value ratio, and availability.
        </div>
      </div>
    </div>
  );
}
