import { NextRequest, NextResponse } from "next/server";
import { extractIntent } from "@/app/lib/intentExtraction";
import { Product } from "@/app/lib/products";

const SERP_API_KEY = process.env.SERP_API_KEY;

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function transformProducts(items: any[]): Product[] {
  return (items || []).map((item: any, i: number) => ({
    name: item.title || "Unknown Product",
    cat: item.source || "Shopping",
    desc: item.snippet || `Sold by ${item.source || "online store"}${item.delivery ? ` · ${item.delivery}` : ""}`,
    price: item.price || "$0",
    num: typeof item.extracted_price === "number" ? item.extracted_price : 0,
    rating: typeof item.rating === "number" ? String(item.rating) : "0",
    reviews: typeof item.reviews === "number" ? formatReviews(item.reviews) : "0",
    // TODO D5: Replace with real utility score from soft preference vector
    // once Kevin's Data Agent returns enriched result objects
    match: `${Math.max(60, 99 - i * 3)}%`,
    img: item.thumbnail || "",
    // TODO B-03: item.product_link is a Google Shopping URL, not a direct retailer URL
    // Affiliate linking (Skimlinks/Amazon Associates) requires direct retailer URLs
    // Kevin's Data Agent (K8) is responsible for resolving this before enriched results replace SerpAPI
    link: item.product_link || "",
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

  const results = data.shopping_results || [];
  console.log("[SerpAPI] Got", results.length, "results");
  return results;
}

// POST: LLM intent extraction → refined SerpAPI query → filtered products
export async function POST(request: NextRequest) {
  const { query, history, accumulatedIntent } = await request.json();
  // accumulatedIntent is the client-side merged state from prior turns — logged here for
  // observability; will be consumed directly by D5 utility scoring once Kevin's Data Agent ships
  if (accumulatedIntent && Object.keys(accumulatedIntent).length > 0) {
    console.log("[POST /api/search] Accumulated intent:", JSON.stringify(accumulatedIntent));
  }

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  if (!SERP_API_KEY) return NextResponse.json({ error: "SERP_API_KEY not configured" }, { status: 500 });

  // Step 1: Extract structured intent via LLM (full conversation history passed — CRITICAL)
  const intent = await extractIntent(query, history);

  // Step 2: Clarification needed — skip search, return question as chat message
  if (intent.clarification_needed) {
    const message = intent.clarification_question || "Could you tell me a bit more about what you're looking for?";
    console.log("[POST /api/search] Clarification needed:", message);
    return NextResponse.json({ products: [], chatResponse: message, clarificationNeeded: true, intent });
  }

  // Step 3: Use search_query from structured output directly (already incorporates all constraints)
  const searchQuery = intent.search_query || query;

  // Step 4: Call SerpAPI
  let rawItems: any[];
  try {
    rawItems = await callSerpAPI(searchQuery);
  } catch (err) {
    console.error("[POST /api/search] SerpAPI failed:", err);
    return NextResponse.json(
      { error: "Search service unavailable", products: [], chatResponse: intent.chat_response || "", intent },
      { status: 502 }
    );
  }

  // Step 5: Transform and filter by hard constraint price bounds
  let products = transformProducts(rawItems);
  const { budget_ceiling, budget_floor, must_have_attributes } = intent.hard_constraints;
  if (budget_ceiling) products = products.filter((p) => p.num > 0 && p.num <= budget_ceiling);
  if (budget_floor) products = products.filter((p) => p.num >= budget_floor);
  if (must_have_attributes && must_have_attributes.length > 0) {
    const attrs = must_have_attributes.map((a) => a.toLowerCase());
    products = products.filter((p) =>
      attrs.some((attr) => p.name.toLowerCase().includes(attr))
    );
  }

  const chatResponse = intent.chat_response || "Here are the best matches I found for you!";
  console.log("[POST /api/search] Returning", products.length, "products for:", searchQuery);
  return NextResponse.json({ products, chatResponse, clarificationNeeded: false, intent });
}
