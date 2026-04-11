import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { extractIntent } from "@/app/lib/intentExtraction";
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

// Serper's item.link is always a Google Shopping URL — not a direct retailer link.
// This map constructs a direct retailer search URL from source + title.
// Unknown retailers fall back to a Google web search (surfaces direct product links as top results).
const RETAILER_SEARCH: Record<string, (t: string) => string> = {
  'amazon':          (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t)}`,
  'target':          (t) => `https://www.target.com/s?searchTerm=${encodeURIComponent(t)}`,
  'walmart':         (t) => `https://www.walmart.com/search?q=${encodeURIComponent(t)}`,
  'best buy':        (t) => `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(t)}`,
  'nordstrom':       (t) => `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${encodeURIComponent(t)}`,
  'old navy':        (t) => `https://www.oldnavy.com/browse/search.do?searchText=${encodeURIComponent(t)}`,
  'gap':             (t) => `https://www.gap.com/browse/search.do?searchText=${encodeURIComponent(t)}`,
  'banana republic': (t) => `https://www.bananarepublic.com/browse/search.do?searchText=${encodeURIComponent(t)}`,
  "macy's":          (t) => `https://www.macys.com/shop/search?keyword=${encodeURIComponent(t)}`,
  'macys':           (t) => `https://www.macys.com/shop/search?keyword=${encodeURIComponent(t)}`,
  "dillard's":       (t) => `https://www.dillards.com/search?searchString=${encodeURIComponent(t)}`,
  'dillards':        (t) => `https://www.dillards.com/search?searchString=${encodeURIComponent(t)}`,
  "men's wearhouse": (t) => `https://www.menswearhouse.com/search?q=${encodeURIComponent(t)}`,
  'tommy bahama':    (t) => `https://www.tommybahama.com/search?q=${encodeURIComponent(t)}`,
  'ralph lauren':    (t) => `https://www.ralphlauren.com/search?q=${encodeURIComponent(t)}`,
  'abercrombie':     (t) => `https://www.abercrombie.com/shop/us/search?q=${encodeURIComponent(t)}`,
  'uniqlo':          (t) => `https://www.uniqlo.com/us/en/search?q=${encodeURIComponent(t)}`,
  'zara':            (t) => `https://www.zara.com/us/en/search?searchTerm=${encodeURIComponent(t)}`,
  'h&m':             (t) => `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(t)}`,
  'etsy':            (t) => `https://www.etsy.com/search?q=${encodeURIComponent(t)}`,
  'wayfair':         (t) => `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(t)}`,
  'home depot':      (t) => `https://www.homedepot.com/s/${encodeURIComponent(t)}`,
  'lowe\'s':         (t) => `https://www.lowes.com/search?searchTerm=${encodeURIComponent(t)}`,
  'costco':          (t) => `https://www.costco.com/CatalogSearch?keyword=${encodeURIComponent(t)}`,
  'ebay':            (t) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(t)}`,
};

function isDirectRetailerUrl(url: string): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return !hostname.includes('google.com');
  } catch {
    return false;
  }
}

function buildRetailerUrl(source: string, title: string, originalLink: string): string {
  // Serper sometimes returns direct retailer URLs — use them as-is
  if (isDirectRetailerUrl(originalLink)) return originalLink;

  // Google Shopping URL: try to build a retailer-specific search URL instead
  const key = source.toLowerCase().trim();
  for (const [retailer, fn] of Object.entries(RETAILER_SEARCH)) {
    if (key.includes(retailer)) return fn(title);
  }

  // Unknown retailer with no direct URL: fall back to Google Shopping (better than a web search)
  return originalLink;
}

function mapSerperResult(item: any): any {
  const source = item.source ?? '';
  const title = item.title ?? '';
  const originalLink = item.link ?? '';
  return {
    title,
    price: item.price ?? '',
    thumbnail: item.imageUrl ?? '',
    source,
    product_link: buildRetailerUrl(source, title, originalLink),
    rating: item.rating ?? null,
    reviews: item.ratingCount ?? null,
    product_id: item.productId ?? null,
    serpapi_immersive_product_api: null,
  };
}


async function callSerpAPIBatch(queries: string[]): Promise<any[]> {
  const settled = await Promise.allSettled(queries.map((q) => callSerpAPI(q)));

  const merged: any[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      merged.push(...result.value.map(mapSerperResult));
    } else {
      console.warn(`[Serper] Query failed: ${queries[index]}`, result.reason);
    }
  });

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = (item.product_link || item.title || "").toLowerCase().trim();
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

  // [AFFILIATE - D10] resolveRetailerUrls() disabled pending Skimlinks/catalog integration.
  // Serper returns direct retailer URLs on item.link in most cases.
  // Uncomment when Kevin's catalog provides direct retailer URLs as first-class field,
  // or when Skimlinks server-side wrapping is implemented.
  //
  // const resolvedItems = await resolveRetailerUrls(rawItems);
  console.log('[affiliate] resolveRetailerUrls disabled — affiliate_degraded: true for all results');
  const resolvedItems = rawItems;

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
    ? "Here are the closest options I found."
    : intent.chat_response || "Here are the best matches I found for you!";

  // D10-partial: resolveTop3Urls() disabled — Serper /shopping does not support product detail mode.
  // Passing productId is not a supported param; results still return google.com links.
  // Re-enable when Kevin's catalog provides direct retailer URLs as a first-class field (D10-full).
  // filteredProducts = await resolveTop3Urls(filteredProducts);

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