import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { extractIntent } from "@/app/lib/intentExtraction";
import { Product } from "@/app/lib/products";

const SERP_API_KEY = process.env.SERP_API_KEY;
const SEARCH_VARIANT_COUNT = 3;
const RESULTS_PER_QUERY = 10; // note: google_shopping engine ignores num — slice applied post-fetch
const MAX_RESULTS_PER_QUERY = 10; // hard cap applied after fetch since SerpAPI ignores num
  
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "openai/gpt-4o-mini";

interface OnlineSeller {
  name: string;
  link: string;
  price?: string;
  extracted_price?: number;
}

const PREFERRED_RETAILERS = [
  "amazon",
  "target",
  "walmart",
  "bestbuy",
  "best buy",
  "nordstrom",
];

function pickBestSeller(sellers: OnlineSeller[]): OnlineSeller | null {
  if (!sellers || sellers.length === 0) return null;

  for (const preferred of PREFERRED_RETAILERS) {
    const match = sellers.find((s) => s.name.toLowerCase().includes(preferred));
    if (match) return match;
  }

  return sellers[0];
}

async function resolveRetailerUrls(rawItems: any[]): Promise<any[]> {
  const resolved = await Promise.all(
    rawItems.map(async (item) => {
      if (!item.serpapi_immersive_product_api) {
        return { ...item, affiliate_degraded: true };
      }

      try {
        const urlWithKey = `${item.serpapi_immersive_product_api}&api_key=${SERP_API_KEY}`;
        const response = await fetch(urlWithKey);
        const data = await response.json();

        const sellers: OnlineSeller[] = data?.product_results?.stores ?? [];
        const best = pickBestSeller(sellers);

        if (!best) {
          return { ...item, affiliate_degraded: true };
        }

        return {
          ...item,
          product_link: best.link,
          source: best.name,
          ...(best.price !== undefined ? { price: best.price } : {}),
          ...(best.extracted_price !== undefined ? { extracted_price: best.extracted_price } : {}),
        };
      } catch {
        return { ...item, affiliate_degraded: true };
      }
    })
  );

  const resolvedCount = resolved.filter((i) => !i.affiliate_degraded).length;
  console.log(
    `[URL Resolution] ${resolvedCount}/${rawItems.length} resolved to direct retailer URLs`
  );

  return resolved;
}

function formatReviews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function buildSearchQueries(baseQuery: string, intent: any): string[] {
  const related = Array.isArray(intent?.related_search_queries)
    ? intent.related_search_queries
    : [];

  const queries = [baseQuery, ...related]
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean);

  return [...new Set(queries)].slice(0, SEARCH_VARIANT_COUNT);
}

async function callSerpAPI(searchQuery: string): Promise<any[]> {
  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", searchQuery);
  url.searchParams.set("api_key", SERP_API_KEY!);
  url.searchParams.set("num", String(RESULTS_PER_QUERY));

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    console.error("[SerpAPI] Error:", data.error);
    throw new Error(data.error);
  }

  const results = data.shopping_results || [];
  if (results.length > 0) {
    console.log("[SerpAPI] results[0]:", JSON.stringify(results[0], null, 2));
  }

  return results.slice(0, MAX_RESULTS_PER_QUERY);
}

async function callSerpAPIBatch(queries: string[]): Promise<any[]> {
  const settled = await Promise.allSettled(queries.map((q) => callSerpAPI(q)));

  const merged: any[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    } else {
      console.warn(`[SerpAPI] Query failed: ${queries[index]}`, result.reason);
    }
  });

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = (item.link || item.product_link || item.title || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function transformProducts(items: any[]): Product[] {
  return (items || []).map((item: any, i: number) => ({
    name: item.title || "Unknown Product",
    cat: item.source || "Shopping",
    desc:
      item.snippet ||
      `Sold by ${item.source || "online store"}${item.delivery ? ` · ${item.delivery}` : ""}`,
    price: item.price || "$0",
    num: typeof item.extracted_price === "number" ? item.extracted_price : 0,
    rating: typeof item.rating === "number" ? String(item.rating) : "0",
    reviews: typeof item.reviews === "number" ? formatReviews(item.reviews) : "0",
    match: `${Math.max(60, 99 - i * 3)}%`,
    img: item.thumbnail || "",
    link: item.product_link || "",
    affiliate_degraded: item.affiliate_degraded ?? false,
    explanation: item.explanation ?? undefined,
  }));
}

// D6: Fires in parallel with callSerpAPIBatch — takes only the intent summary so it
// can start before products are known. Returns 3 intent-framing sentences by position.
async function generateExplanations(intentSummary: string): Promise<string[]> {
  try {
    const prompt = `You are a shopping assistant. A user is looking for: "${intentSummary}"

Generate exactly 3 short sentences explaining why search results match this intent. Each sentence should highlight a different aspect of the match (e.g. category fit, constraint match, quality signal).

Return ONLY a raw JSON object:
{ "explanations": [string, string, string] }

Rules:
- Each explanation must be ONE sentence, maximum 15 words
- Reference specific details from the intent summary — do not be generic
- Do not mention specific product names or prices
- Do not use generic praise like "a great choice" or "matches what you're looking for"
- Good: "Fits your merino wool requirement with natural fiber construction."
- Bad: "This product is a great match for your needs."`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("[D6] Empty explanation response");
      return [];
    }

    const parsed = JSON.parse(content);
    const explanations = parsed.explanations;
    if (!Array.isArray(explanations) || explanations.length === 0) {
      console.warn("[D6] Malformed explanation response:", content);
      return [];
    }

    return explanations.filter((e): e is string => typeof e === "string").slice(0, 3);
  } catch (err) {
    console.warn("[D6] generateExplanations failed — returning []:", err);
    return [];
  }
}

// POST: LLM intent extraction → expanded SerpAPI query set → filtered products
export async function POST(request: NextRequest) {
  const { query, history, accumulatedIntent, skipClarification } = await request.json();

  if (accumulatedIntent && Object.keys(accumulatedIntent).length > 0) {
    console.log("[POST /api/search] Accumulated intent present");
  }

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  if (!SERP_API_KEY) {
    return NextResponse.json({ error: "SERP_API_KEY not configured" }, { status: 500 });
  }

  const intent = await extractIntent(query, history);

  if (intent.clarification_needed && !skipClarification) {
    const message =
      intent.clarification_question ||
      "Could you tell me a bit more about what you're looking for?";
    return NextResponse.json({
      products: [],
      chatResponse: message,
      clarificationNeeded: true,
      intent,
    });
  }

  const baseQuery = intent.search_query || query;
  const searchQueries = buildSearchQueries(baseQuery, intent);

  console.log("[Search] Queries:", searchQueries);

  // D6 fires in parallel with SerpAPI — uses only intent summary, no product names needed
  let rawItems: any[];
  let explanations: string[];
  try {
    [rawItems, explanations] = await Promise.all([
      callSerpAPIBatch(searchQueries),
      generateExplanations(intent.raw_intent_summary),
    ]);

    if (rawItems.length === 0) {
      console.warn("[POST /api/search] SerpAPI returned 0 results for queries:", searchQueries);
      return NextResponse.json({
        products: [],
        chatResponse:
          "I couldn't find results for that — could you describe what you're looking for differently?",
        clarificationNeeded: false,
        intent,
      });
    }
  } catch (err) {
    console.error("[POST /api/search] SerpAPI failed:", err);
    return NextResponse.json(
      {
        error: "Search service unavailable",
        products: [],
        chatResponse: "I'm having trouble searching right now — please try again in a moment.",
        clarificationNeeded: false,
        intent,
      },
      { status: 502 }
    );
  }

  const resolvedItems = rawItems;
  // resolveRetailerUrls temporarily disabled — re-enable before demo
  // const resolvedItems = await resolveRetailerUrls(rawItems);

  const products = transformProducts(resolvedItems);
  const { budget_ceiling, budget_floor, must_have_attributes } = intent.hard_constraints;

  let filteredProducts = [...products];

  if (budget_ceiling) {
    filteredProducts = filteredProducts.filter((p) => p.num > 0 && p.num <= budget_ceiling);
  }

  if (budget_floor) {
    filteredProducts = filteredProducts.filter((p) => p.num >= budget_floor);
  }

  if (must_have_attributes && must_have_attributes.length > 0) {
    const attrs = must_have_attributes.map((a) => a.toLowerCase());
    filteredProducts = filteredProducts.filter((p) =>
      attrs.some((attr) => p.name.toLowerCase().includes(attr))
    );
  }

  let priceFilterApplied = true;
  if (filteredProducts.length === 0 && products.length > 0) {
    console.warn(
      "[POST /api/search] Filters removed all results — returning unfiltered. Query:",
      searchQueries
    );
    filteredProducts = products;
    priceFilterApplied = false;
  }

  const chatResponse = !priceFilterApplied
    ? "I couldn't find exact matches within your constraints, but here are the closest options I found."
    : intent.chat_response || "Here are the best matches I found for you!";

  // D6: Attach explanations by position to top 3 products
  if (explanations.length > 0) {
    filteredProducts = filteredProducts.map((p, i) => ({
      ...p,
      explanation: i < explanations.length ? explanations[i] : undefined,
    }));
  }

  return NextResponse.json({
    products: filteredProducts,
    chatResponse,
    clarificationNeeded: false,
    intent,
  });
}