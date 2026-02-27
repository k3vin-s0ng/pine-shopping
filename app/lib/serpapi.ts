import { Product } from "./products";

export interface SearchParams {
  query: string;
  maxResults?: number;
  minPrice?: number;
  maxPrice?: number;
}

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export async function searchProducts(params: SearchParams): Promise<Product[]> {
  const { query, maxResults = 10, minPrice, maxPrice } = params;

  const url = new URL("/api/search", window.location.origin);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(maxResults));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();
  const items: any[] = data.shopping_results || [];

  let products: Product[] = items.map((item, i) => ({
    name: item.title,
    cat: item.source || "Shopping",
    desc: item.snippet || `${item.source || "Online store"} · ${item.delivery || "Standard shipping"}`,
    price: item.price || "$0",
    num: item.extracted_price || 0,
    rating: item.rating ? String(item.rating) : "0",
    reviews: item.reviews ? formatReviews(item.reviews) : "0",
    match: `${Math.max(60, 99 - i * 3)}%`,
    img: item.thumbnail || "",
    link: item.product_link || item.link || "#",
  }));

  if (minPrice !== undefined) products = products.filter((p) => p.num >= minPrice);
  if (maxPrice !== undefined) products = products.filter((p) => p.num <= maxPrice);

  return products;
}
