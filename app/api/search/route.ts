import { NextRequest, NextResponse } from "next/server";
import { extractIntent } from "@/app/lib/intentExtraction";
import { Product } from "@/app/lib/products";

const SERP_API_KEY = process.env.SERP_API_KEY;

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function transformProducts(items: any[]): Product[] {
  return (items || [])
    .filter((item: any) => item.product_link) // Drop results with no direct retailer link
    .map((item: any, i: number) => ({
      name: item.title || "Unknown Product",
      cat: item.source || "Shopping",
      desc: item.snippet || `Sold by ${item.source || "online store"}${item.delivery ? ` · ${item.delivery}` : ""}`,
      price: item.price || "$0",
      num: typeof item.extracted_price === "number" ? item.extracted_price : 0,
      rating: typeof item.rating === "number" ? String(item.rating) : "0",
      reviews: typeof item.reviews === "number" ? formatReviews(item.reviews) : "0",
      match: `${Math.max(60, 99 - i * 3)}%`,
      img: item.thumbnail || "",
      link: item.product_link, // Always the direct retailer URL
    }));
}

async function callSerpAPI(searchQuery: string): Promise<any[]> {
  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("api_key", SERP_API_KEY!);
  url.searchParams.set("num", "15");

  console.log("[SerpAPI] Querying:", searchQuery);
  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    console.error("[SerpAPI] Error:", data.error);
    throw new Error(data.error);
  }

  console.log("[SerpAPI] Got", data.shopping_results?.length ?? 0, "results");
  return data.shopping_results || [];
}

// POST: LLM intent extraction → refined SerpAPI query → filtered products
export async function POST(request: NextRequest) {
  const { query, history } = await request.json();

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  if (!SERP_API_KEY) return NextResponse.json({ error: "SERP_API_KEY not configured" }, { status: 500 });

  // Step 1: Extract intent via LLM (with full conversation history)
  const intent = await extractIntent(query, history);

  // Step 2: If LLM wants to ask a clarifying question, skip the search
  if (!intent.shouldSearch) {
    console.log("[POST /api/search] LLM asking clarification:", intent.chatResponse);
    return NextResponse.json({ products: [], chatResponse: intent.chatResponse });
  }

  // Step 3: Build refined search query
  let searchQuery = intent.product;
  if (intent.brand) searchQuery = `${intent.brand} ${searchQuery}`;
  if (intent.maxPrice) searchQuery += ` under $${intent.maxPrice}`;

  // Step 4: Call SerpAPI
  let rawItems: any[];
  try {
    rawItems = await callSerpAPI(searchQuery);
  } catch (err) {
    console.error("[POST /api/search] SerpAPI failed:", err);
    return NextResponse.json({ error: "Search service unavailable", products: [], chatResponse: intent.chatResponse }, { status: 502 });
  }

  // Step 5: Transform and filter
  let products = transformProducts(rawItems);
  if (intent.maxPrice) products = products.filter((p) => p.num > 0 && p.num <= intent.maxPrice!);
  if (intent.minPrice) products = products.filter((p) => p.num >= intent.minPrice!);

  console.log("[POST /api/search] Returning", products.length, "products for:", searchQuery);
  return NextResponse.json({ products, chatResponse: intent.chatResponse });
}
