import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createClient } from '@supabase/supabase-js';
import { extractIntent, IntentExtractionResult } from "@/app/lib/intentExtraction";
import { Product } from "@/app/lib/products";

const SEARCH_VARIANT_COUNT = 3;
const MAX_RESULTS_PER_QUERY = 10;

// Catalog retrieval thresholds.
// Similarity: cosine similarity score returned by pgvector (0.0–1.0).
// Set high deliberately — a weak catalog match is worse than a live SerpAPI result.
const CATALOG_SIMILARITY_THRESHOLD = 0.72;
// Minimum results above threshold before we trust the catalog over SerpAPI.
const CATALOG_MIN_RESULTS = 3;
// Candidates fetched from pgvector before filtering — more than needed so filters have room.
const CATALOG_FETCH_LIMIT = 20;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Separate client for embeddings — OpenRouter does not support the embeddings API.
const embeddingsClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "openai/gpt-4o-mini";

// Initialised lazily so missing env vars don't crash the module at import time.
// Only used in retrieveFromCatalog — SerpAPI path never touches this.
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface OnlineSeller {
  name: string;
  link: string;
  price?: string;
  extracted_price?: number;
}

const PREFERRED_RETAILERS = [
  'nordstrom', 'macys', 'zappos', 'asos', 'revolve',
  'abercrombie', 'anthropologie', 'urban outfitters',
  'gap', 'h&m', 'zara', 'amazon', 'target', 'walmart'
];

function pickBestSeller(sellers: OnlineSeller[]): OnlineSeller | null {
  if (!sellers || sellers.length === 0) return null;

  for (const preferred of PREFERRED_RETAILERS) {
    const match = sellers.find((s) => s.name.toLowerCase().includes(preferred));
    if (match) return match;
  }

  return sellers[0];
}

// [AFFILIATE - D10] resolveRetailerUrls() runs on all products — cost-prohibitive at scale.
// Kept for reference. Do not call. Direct URLs are handled by resolveTop3Urls() (top 3 only).
async function resolveRetailerUrls(rawItems: any[]): Promise<any[]> {
  const resolved = await Promise.all(
    rawItems.map(async (item) => {
      if (!item.serpapi_immersive_product_api) {
        return { ...item, affiliate_degraded: true };
      }

      try {
        const urlWithKey = `${item.serpapi_immersive_product_api}&api_key=${process.env.SERPAPI_API_KEY}`;
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

// Extracts a numeric price from a price string (e.g. "$1,299.99" → 1299.99)
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
// Uses only fields available from SerpAPI's shopping response.
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

// [SERPER - D9] Serper implementation preserved — direct retailer URL resolution
// could not be reliably achieved via Serper's product detail endpoint.
// Reinstate when Serper linking issue is resolved.
//
// async function callSerpAPI(searchQuery: string): Promise<any[]> {
//   const res = await fetch('https://google.serper.dev/shopping', {
//     method: 'POST',
//     headers: {
//       'X-API-KEY': process.env.SERPER_API_KEY!,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ q: searchQuery, num: 10, gl: 'us', hl: 'en' }),
//   });
//   if (!res.ok) {
//     console.error(`[Serper] Error: ${res.status} ${res.statusText}`);
//     return [];
//   }
//   const data = await res.json();
//   const results = data.shopping ?? [];
//   return results.slice(0, MAX_RESULTS_PER_QUERY);
// }

async function callSerpAPI(searchQuery: string): Promise<any[]> {
  const params = new URLSearchParams({
    q: searchQuery,
    tbm: 'shop',
    api_key: process.env.SERPAPI_API_KEY!,
    num: String(MAX_RESULTS_PER_QUERY),
    gl: 'us',
    hl: 'en',
  });

  const res = await fetch(`https://serpapi.com/search?${params}`);

  if (!res.ok) {
    console.error(`[SerpAPI] error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return (data.shopping_results ?? []).slice(0, MAX_RESULTS_PER_QUERY);
}

// [SERPER - D9] Field mapping for Serper response shape.
// Preserved for reinstatement when Serper linking issue is resolved.
//
// function mapSerperResult(item: any): any {
//   return {
//     title: item.title ?? '',
//     price: item.price ?? '',
//     thumbnail: item.imageUrl ?? '',
//     source: item.source ?? '',
//     product_link: item.link ?? '',
//     rating: item.rating ?? null,
//     reviews: item.ratingCount ?? null,
//     product_id: item.productId ?? null,
//     serpapi_immersive_product_api: null,
//   };
// }

function mapSerpAPIResult(item: any): any {
  return {
    title: item.title ?? '',
    price: item.price ?? '',
    thumbnail: item.thumbnail ?? '',
    source: item.source ?? '',
    product_link: item.product_link ?? '',
    rating: item.rating ?? null,
    reviews: item.reviews ?? null,
    product_id: item.product_id ?? null,
    serpapi_immersive_product_api: item.serpapi_immersive_product_api ?? null,
  };
}

async function callSerpAPIBatch(
  queries: string[]
): Promise<{ items: any[]; queryOrigins: Map<string, number> }> {
  const results = await Promise.all(
    queries.map((query, index) =>
      callSerpAPI(query).then((products) =>
        products.map((p) => ({ item: mapSerpAPIResult(p), queryRank: index }))
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
    serpapi_immersive_product_api: item.serpapi_immersive_product_api ?? null,
    affiliate_degraded: item.affiliate_degraded ?? false,
    explanation: item.explanation ?? undefined,
  }));
}

// [D10] Resolves direct retailer URLs for top 3 products only.
// Uses SerpAPI's serpapi_immersive_product_api field to call the immersive product
// endpoint, reads product_results.stores, and picks the best direct retailer URL
// by priority. Fires in parallel for top 3 only after D5 scoring.
// Falls back to original product link on any failure or missing field.
async function resolveTop3Urls(products: Product[]): Promise<Product[]> {
  const top3 = products.slice(0, 3);
  const rest = products.slice(3);

  const resolved = await Promise.all(
    top3.map(async (product) => {
      if (!product.serpapi_immersive_product_api) {
        console.warn('[resolveTop3Urls] no immersive API field for:', product.name);
        return product;
      }

      try {
        // serpapi_immersive_product_api URL does not include api_key — must append
        const url = `${product.serpapi_immersive_product_api}&api_key=${process.env.SERPAPI_API_KEY}`;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn('[resolveTop3Urls] immersive call failed:', res.status, product.name);
          return product;
        }

        const data = await res.json();
        const stores: any[] = data.product_results?.stores ?? [];

        if (stores.length === 0) {
          console.warn('[resolveTop3Urls] no stores returned for:', product.name);
          return product;
        }

        // Pick best seller by priority order
        let directUrl: string | null = null;
        let retailerName: string | null = null;

        for (const preferred of PREFERRED_RETAILERS) {
          const match = stores.find((s: any) =>
            (s.name ?? '').toLowerCase().includes(preferred)
          );
          if (match?.link) {
            directUrl = match.link;
            retailerName = match.name;
            break;
          }
        }

        // Fall back to first available store
        if (!directUrl && stores[0]?.link) {
          directUrl = stores[0].link;
          retailerName = stores[0].name ?? null;
        }

        if (!directUrl) {
          console.warn('[resolveTop3Urls] no direct URL found for:', product.name);
          return product;
        }

        console.log(`[resolveTop3Urls] ${product.name.slice(0, 40)} → ${retailerName} ${directUrl}`);
        return {
          ...product,
          link: directUrl,
          cat: retailerName ?? product.cat,
        };
      } catch (err) {
        console.error('[resolveTop3Urls] error for:', product.name, err);
        return product; // fail safe — return original product unchanged
      }
    })
  );

  return [...resolved, ...rest];
}

// Generates an embedding vector for a search query string.
// Used to find semantically similar products in the pgvector index.
// Returns null on any failure — callers must handle null.
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await embeddingsClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    });
    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.error('[catalog] embedding generation failed:', err);
    return null;
  }
}

// Attempts to serve product results from the Supabase catalog using
// pgvector similarity search + SQL filters.
//
// Returns Product[] if the catalog has >= CATALOG_MIN_RESULTS results
// above CATALOG_SIMILARITY_THRESHOLD that pass the hard constraint filters.
//
// Returns null if the catalog has insufficient confident matches or any error occurs.
// Callers must treat null as "fall through to SerpAPI".
// This function must never throw — all errors are caught and return null.
async function retrieveFromCatalog(
  intent: IntentExtractionResult
): Promise<Product[] | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[catalog] Supabase client unavailable — skipping catalog');
      return null;
    }

    const embedding = await generateQueryEmbedding(intent.search_query);
    if (!embedding) {
      console.warn('[catalog] Could not generate query embedding — falling through to SerpAPI');
      return null;
    }

    const { data: rawProducts, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      similarity_threshold: CATALOG_SIMILARITY_THRESHOLD,
      match_count: CATALOG_FETCH_LIMIT,
    });

    if (error) {
      console.error('[catalog] pgvector query failed:', error.message);
      return null;
    }

    if (!rawProducts || rawProducts.length === 0) {
      console.log('[catalog] No results above similarity threshold — falling through to SerpAPI');
      return null;
    }

    // Fetch pricing for matched products.
    // Pick one pricing row per product — prefer in_stock, then lowest price.
    const productIds = rawProducts.map((p: any) => p.id);

    const { data: pricingRows, error: pricingError } = await supabase
      .from('product_pricing')
      .select('product_id, merchant, affiliate_url, price_cents, sale_price_cents, availability')
      .in('product_id', productIds)
      .eq('availability', 'in_stock')
      .order('price_cents', { ascending: true });

    if (pricingError) {
      console.error('[catalog] pricing query failed:', pricingError.message);
      return null;
    }

    // Build a map of product_id → best pricing row (already sorted lowest price first).
    const pricingMap = new Map<number, any>();
    for (const row of pricingRows ?? []) {
      if (!pricingMap.has(row.product_id)) {
        pricingMap.set(row.product_id, row);
      }
    }

    const { budget_ceiling, budget_floor, must_have_attributes } = intent.hard_constraints;

    const products: Product[] = [];

    for (const raw of rawProducts) {
      const pricing = pricingMap.get(raw.id);
      if (!pricing) continue;

      const priceDollars = pricing.price_cents != null ? pricing.price_cents / 100 : null;

      if (budget_ceiling != null && priceDollars != null && priceDollars > budget_ceiling) continue;
      if (budget_floor != null && priceDollars != null && priceDollars < budget_floor) continue;

      // Attribute match proxy — same approach as D5-interim for SerpAPI results.
      // Real attribute matching will use structured specs once Kevin's K3/K4 pipeline
      // populates the attributes JSONB column.
      if (must_have_attributes && must_have_attributes.length > 0) {
        const titleLower = (raw.title ?? '').toLowerCase();
        const allMatch = must_have_attributes.every((attr: string) =>
          titleLower.includes(attr.toLowerCase())
        );
        if (!allMatch) continue;
      }

      const priceStr = priceDollars != null ? `$${priceDollars.toFixed(2)}` : '';

      products.push({
        name: raw.title ?? 'Unknown Product',
        cat: pricing.merchant ?? 'Fashion',
        desc: `Sold by ${pricing.merchant ?? 'retailer'}`,
        price: priceStr,
        num: priceDollars ?? 0,
        rating: raw.attributes?.rating != null ? String(raw.attributes.rating) : '0',
        reviews: raw.attributes?.review_count != null
          ? formatReviews(raw.attributes.review_count)
          : '0',
        match: `${Math.round((raw.similarity ?? 0) * 100)}%`,
        img: (raw.image_urls ?? [])[0] ?? '',
        link: pricing.affiliate_url ?? '',
        product_id: raw.external_id ?? null,
        serpapi_immersive_product_api: null,
        affiliate_degraded: !pricing.affiliate_url,
        explanation: undefined,
      });
    }

    if (products.length < CATALOG_MIN_RESULTS) {
      console.log(
        `[catalog] ${products.length} results after filtering — below minimum of ${CATALOG_MIN_RESULTS}, falling through to SerpAPI`
      );
      return null;
    }

    console.log(`[catalog] Serving ${products.length} results from catalog (similarity >= ${CATALOG_SIMILARITY_THRESHOLD})`);
    return products;

  } catch (err) {
    console.error('[catalog] Unexpected error in retrieveFromCatalog:', err);
    return null;
  }
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

// POST: LLM intent extraction → catalog (pgvector) → SerpAPI fallback → price/attr filter → D10 URL resolution → D6 explanations
export async function POST(request: NextRequest) {
  const { query, history, accumulatedIntent, skipClarification } = await request.json();

  if (accumulatedIntent && Object.keys(accumulatedIntent).length > 0) {
    console.log("[POST /api/search] Accumulated intent present");
  }

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  if (!process.env.SERPAPI_API_KEY) {
    return NextResponse.json({ error: 'SERPAPI_API_KEY not configured' }, { status: 500 });
  }

  // Catalog is optional — missing vars disable catalog path, SerpAPI serves all requests.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[catalog] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — catalog retrieval disabled');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[catalog] OPENAI_API_KEY not set — catalog retrieval disabled (embeddings unavailable)');
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

  console.log('[search] queries:', searchQueries);

  // Attempt catalog retrieval first.
  // null means the catalog cannot serve this request confidently — fall through to SerpAPI.
  const catalogProducts = await retrieveFromCatalog(intent);

  let rawProducts: Product[];
  let explanations: string[];

  if (catalogProducts !== null) {
    // --- Catalog path ---
    // Enough high-confidence results returned. Skip SerpAPI entirely.
    // D6 still fires — it only needs the intent summary, not product data.
    console.log('[search] serving from catalog');
    try {
      explanations = await generateExplanations(intent.raw_intent_summary);
    } catch (err) {
      console.warn('[D6] explanation generation failed — continuing without explanations:', err);
      explanations = [];
    }
    rawProducts = catalogProducts;

  } else {
    // --- SerpAPI fallback path ---
    // Catalog miss or insufficient confidence. Behaviour unchanged from before.
    console.log('[search] catalog miss — falling through to SerpAPI');
    try {
      let batchResult: { items: any[]; queryOrigins: Map<string, number> };
      [batchResult, explanations] = await Promise.all([
        callSerpAPIBatch(searchQueries),
        generateExplanations(intent.raw_intent_summary),
      ]);

      const { items: rawItems, queryOrigins } = batchResult;

      if (rawItems.length === 0) {
        console.warn('[POST /api/search] SerpAPI returned 0 results for queries:', searchQueries);
        return NextResponse.json({
          products: [],
          chatResponse: "I couldn't find results for that — could you describe what you're looking for differently?",
          clarificationNeeded: false,
          intent,
        });
      }

      const serpProducts = transformProducts(rawItems);
      rawProducts = scoreAndRankProducts(serpProducts, intent, queryOrigins);

    } catch (err) {
      console.error('[POST /api/search] SerpAPI failed:', err);
      return NextResponse.json(
        {
          error: 'Search service unavailable',
          products: [],
          chatResponse: "I'm having trouble searching right now — please try again in a moment.",
          clarificationNeeded: false,
          intent,
        },
        { status: 502 }
      );
    }
  }

  // From this point on, rawProducts is populated regardless of which path served it.

  // Filter BEFORE resolveTop3Urls so URL resolution targets the 3 cards the user actually sees.
  // If filtering removes everything, fall back to unfiltered ranked list.
  const { budget_ceiling, budget_floor, must_have_attributes } = intent.hard_constraints;

  let filteredProducts = [...rawProducts];

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
  if (filteredProducts.length === 0 && rawProducts.length > 0) {
    console.warn(
      "[POST /api/search] Filters removed all results — returning unfiltered. Query:",
      searchQueries
    );
    filteredProducts = rawProducts;
    priceFilterApplied = false;
  }

  // [D10] Resolve direct retailer URLs for the top 3 visible products — parallel SerpAPI
  // immersive calls. Runs after filtering so the 3 resolved products match the 3 UI cards.
  // Falls back to SerpAPI product_link on any failure. Products 4+ keep product_link.
  // Catalog results already contain direct affiliate URLs — resolveTop3Urls
  // is only needed for SerpAPI results, which return Google Shopping redirect
  // links that require immersive endpoint resolution.
  filteredProducts = catalogProducts !== null
    ? filteredProducts
    : await resolveTop3Urls(filteredProducts);

  const chatResponse = !priceFilterApplied
    ? "Here are the closest options I found."
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
