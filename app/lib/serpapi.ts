import { Product } from "./products";

export async function searchProducts(query: string): Promise<Product[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();
  return data.products || [];
}
