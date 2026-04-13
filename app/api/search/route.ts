import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { extractIntent, IntentExtractionResult } from "@/app/lib/intentExtraction";
import { Product } from "@/app/lib/products";

const SERP_API_KEY = process.env.SERP_API_KEY; // retained for resolveRetailerUrls body (disabled call)
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SEARCH_VARIANT_COUNT = 3;
const MAX_RESULTS_PER_QUERY = 10;
  
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

// Extracts a numeric price from Serper's price string (e.g. "$1,299.99" → 1299.99)
// Returns null if unparseable — callers must handle null explicitly
function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Parses Product.reviews formatted string back to a number ("1.2k" → 1200, "0" → 0)
function parseReviewCount(reviewStr: string | null | undefined): number {
  if (!reviewStr) return 0;
  const s = reviewStr.trim().toLowerCase();
  if (s.endsWith('k')) return Math.round(parseFloat(s) * 1000);
  return parseInt(s) || 0;
}

// [D5-interim] Scores a single product against the user's extracted intent.
// Uses only fields available from Serper's shopping response.
// Returns a numeric score — higher is better. No floor or ceiling.
// Will be replaced by full utility scoring against Kevin's enriched result
// objects (K5) in Phase 2.
function scoreProduct(
  product: Product,
  intent: IntentExtractionResult,
  queryRank: number  // 0 = primary query, 1 = first related, 2 = second related
): number {
  let score = 0;
  const price = parsePrice(product.price);
  const nameLower = (product.name ?? '').toLowerCase();

  // --- Hard constraint: budget ceiling ---
  // Hard violation — push well below any compliant product
  if (intent.hard_constraints?.budget_ceiling != null) {
    if (price != null && price <= intent.hard_constraints.budget_ceiling) {
      score += 30;
    } else if (price != null) {
      score -= 100; // hard violation — deprioritise regardless of other signals
    }
    // price === null: no penalty, no reward — unknown price is neutral
  }

  // --- Hard constraint: budget floor ---
  if (intent.hard_constraints?.budget_floor != null && price != null) {
    if (price >= intent.hard_constraints.budget_floor) {
      score += 10;
    } else {
      score -= 40;
    }
  }

  // --- Hard constraint: must_have_attributes (name match) ---
  // This is a proxy — real attribute matching requires Kevin's structured specs.
  // Rewarded per matching attribute found in product name.
  for (const attr of intent.hard_constraints?.must_have_attributes ?? []) {
    if (nameLower.includes(attr.toLowerCase())) {
      score += 20;
    }
  }

  // --- Soft preference: vibe_keywords (name match) ---
  // Lower weight than hard constraints — these are preferences, not requirements.
  for (const kw of intent.soft_preferences?.vibe_keywords ?? []) {
    if (nameLower.includes(kw.toLowerCase())) {
      score += 8;
    }
  }

  // --- Soft preference: quality_priority ---
  // High quality priority → reward higher-rated products more aggressively
  const qualityMultiplier =
    intent.soft_preferences?.quality_priority === 'high' ? 6 :
    intent.soft_preferences?.quality_priority === 'low'  ? 2 : 4;

  const ratingNum = parseFloat(product.rating ?? '0');
  if (!isNaN(ratingNum) && ratingNum > 0) {
    score += ratingNum * qualityMultiplier; // max +30 at 5.0 rating, high quality
  }

  // --- Review volume — trust signal ---
  // Diminishing returns: 100+ reviews earns +5, 1000+ earns another +5
  const reviews = parseReviewCount(product.reviews);
  if (reviews > 100)  score += 5;
  if (reviews > 1000) score += 5;

  // --- Query source weight ---
  // Primary query is the most precise expression of user intent.
  // Penalise related query results slightly so ties break in favour of primary.
  score -= queryRank * 5;

  return score;
}

// [D5-interim] Scores all products and returns them sorted highest-score-first.
// queryOrigins maps each product's name to its query rank (0/1/2).
// Products with identical scores retain their original relative order (stable sort).
function scoreAndRankProducts(
  products: Product[],
  intent: IntentExtractionResult,
  queryOrigins: Map<string, number>
): Product[] {
  const scored = products.map((product) => ({
    product,
    score: scoreProduct(
      product,
      intent,
      queryOrigins.get(product.name) ?? 1 // default to related-query weight if unknown
    ),
  }));

  // Log top 5 scores for observability — remove in Phase 2 when D5-full replaces this
  const top5 = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  console.log('[D5-interim scores]', top5.map(s => ({
    title: s.product.name.slice(0, 40),
    score: s.score,
    price: s.product.price,
    rating: s.product.rating,
  })));

  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.product);
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
  const res = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: searchQuery,
      num: 10,
      gl: 'us',
      hl: 'en',
    }),
  });

  if (!res.ok) {
    console.error(`[Serper] Error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  const results = data.shopping ?? [];
  return results.slice(0, MAX_RESULTS_PER_QUERY);
}


function mapSerperResult(item: any): any {
  return {
    title: item.title ?? '',
    price: item.price ?? '',
    thumbnail: item.imageUrl ?? '',
    source: item.source ?? '',
    product_link: item.link ?? '',
    rating: item.rating ?? null,
    reviews: item.ratingCount ?? null,
    product_id: item.productId ?? null,
    serpapi_immersive_product_api: null,
  };
}


async function callSerpAPIBatch(
  queries: string[]
): Promise<{ items: any[]; queryOrigins: Map<string, number> }> {
  const results = await Promise.all(
    queries.map((query, index) =>
      callSerpAPI(query).then((products) =>
        products.map((p) => ({ item: mapSerperResult(p), queryRank: index }))
      )
    )
  );

  const seen = new Set<string>();
  const merged: any[] = [];
  const queryOrigins = new Map<string, number>();

  for (const batch of results) {
    for (const { item, queryRank } of batch) {
      const key = (item.title || '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      queryOrigins.set(item.title, queryRank);
    }
  }

  return { items: merged, queryOrigins };
}

function transformProducts(items: any[]): Product[] {
  return (items || []).map((item: any, i: number) => ({
    name: item.title || "Unknown Product",
    cat: item.source || "Shopping",
    desc:
      item.snippet ||
      `Sold by ${item.source || "online store"}${item.delivery ? ` · ${item.delivery}` : ""}`,
    price: item.price || "$0",
    num: typeof item.extracted_price === "number"
      ? item.extracted_price
      : parseFloat(String(item.price ?? "").replace(/[^0-9.]/g, "")) || 0,
    rating: typeof item.rating === "number" ? String(item.rating) : "0",
    reviews: typeof item.reviews === "number" ? formatReviews(item.reviews) : "0",
    match: `${Math.max(60, 99 - i * 3)}%`,
    img: item.thumbnail || "",
    link: item.product_link || "",
    product_id: item.product_id ?? null,
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
  if (!SERPER_API_KEY) {
    return NextResponse.json({ error: "SERPER_API_KEY not configured" }, { status: 500 });
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
  let queryOrigins: Map<string, number>;
  let explanations: string[];
  try {
    let batchResult: { items: any[]; queryOrigins: Map<string, number> };
    [batchResult, explanations] = await Promise.all([
      callSerpAPIBatch(searchQueries),
      generateExplanations(intent.raw_intent_summary),
    ]);
    rawItems = batchResult.items;
    queryOrigins = batchResult.queryOrigins;

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

  // [AFFILIATE - D10] resolveRetailerUrls() disabled pending Skimlinks/catalog integration.
  // Serper returns direct retailer URLs on item.link in most cases.
  // Uncomment when Kevin's catalog provides direct retailer URLs as first-class field,
  // or when Skimlinks server-side wrapping is implemented.
  //
  // const resolvedItems = await resolveRetailerUrls(rawItems);
  console.log('[affiliate] resolveRetailerUrls disabled — affiliate_degraded: true for all results');
  const resolvedItems = rawItems;

  const products = transformProducts(resolvedItems);

  // [D5-interim] Reorder by constraint satisfaction + quality signals
  const rankedProducts = scoreAndRankProducts(products, intent, queryOrigins);

  const { budget_ceiling, budget_floor, must_have_attributes } = intent.hard_constraints;

  let filteredProducts = [...rankedProducts];

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
    ? "Here are the closest options I found."
    : intent.chat_response || "Here are the best matches I found for you!";

  // [D10-partial disabled] SerpAPI google_immersive_product requires a page_token from SerpAPI's
  // own shopping results — not compatible with Serper's productId. Direct product page URLs
  // will be available when Kevin's catalog provides them as a first-class field (D10-full).

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