import { Product } from "./products";

export interface SearchResult {
  products: Product[];
  chatResponse: string;
}

export interface ConversationTurn {
  role: "user" | "ai";
  content: string;
}

export async function searchProducts(
  query: string,
  history?: ConversationTurn[]
): Promise<SearchResult> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, history }),
  });

  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();
  return {
    products: data.products || [],
    chatResponse: data.chatResponse || "",
  };
}
