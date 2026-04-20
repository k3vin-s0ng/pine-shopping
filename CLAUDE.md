# Pine — Claude Code Session Briefing

> Read this file first, every session. Then read `PLAN.md` and `TODO.md` before writing any code.

---

## What Is Pine?

Pine is an AI-powered conversational fashion shopping assistant. The core differentiator is **conversational intent translation** — users describe what they want naturally and Pine returns real, purchasable fashion items. This is NOT a search engine with a chat wrapper. Context retention across turns is a first-class product requirement.

**Niche: fashion only.** Pine does not attempt to cover general shopping. Narrowing to fashion enables a high-quality, expert-feeling catalog, better affiliate rates, and a defensible demo. Categories in scope: apparel, footwear, accessories, outerwear. Categories out of scope: electronics, home goods, sporting equipment, beauty (revisit post-funding).

The platform has two modes:
- **Shop Mode** — single-item conversational fashion discovery
- **Plan Mode** — multi-item outfit planning for occasions, trips, seasonal wardrobe builds

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + React |
| LLM | OpenRouter → GPT-4o-mini |
| Product Search (live fallback) | SerpAPI (Google Shopping) — fallback only once catalog is live |
| Product Catalog (primary) | Postgres + pgvector (Supabase) — Phase 2 in progress |
| Cache | Redis (Upstash) — Phase 2 in progress |
| Catalog Ingestion | DataForSEO Merchant API (async batch only — never real-time) |
| Database | Kevin — catalog Phase 2; user DB Phase 4 |
| Design | Figma |

---

## Team & Ownership

| Person | Domain |
|---|---|
| Daniel | LLM integration, Reasoning Agent, product management, product catalog (Phase 2) |
| Kevin | Backend infrastructure, Data Agent (scraping + retrieval), Reddit reviews database (Phase 2) |
| Eric | Product vision, UI/UX design, voice interface |

Daniel is the PM. When making architecture decisions, flag tradeoffs clearly so Daniel can make the call.

---

## Architecture Overview (Current — Level 3.5+)

```
User Message
    ↓
Intent Extraction (LLM) ← MUST receive full conversation history
    ↓
Search Query Builder
    ├── search_query (primary)
    └── related_search_queries[] (0–2 semantic variants from LLM)
    ↓
SerpAPI Google Shopping (parallel batch — up to 3 queries)
    ↓
resolveRetailerUrls() ← parallel per-product (top 3 only)
    └── serpapi_immersive_product_api → product_results.stores → best seller URL
    ↓
Result Formatter + Price/Attribute Filters
    ↓
Response + Product Cards with direct retailer URLs (affiliate-ready)
```

## Architecture Target (Level 4 — In Progress)

```
User Voice/Text Input
    ↓
Reasoning Agent (Daniel)
    ├── Structured Intent Extraction → { hard_constraints, soft_preferences, confidence_score }
    ├── Confidence Check
    │     ├── Low (<0.5): Fire clarification question (double-duty: narrows + reweights)
    │     └── High (≥0.5): Proceed to retrieval
    ↓
Redis Cache (Upstash) ← keyed by normalized intent hash, 1–6h TTL
    ↓ miss
Postgres + pgvector Catalog (Daniel — K-catalog-1)
    ├── HNSW vector similarity on intent embedding
    ├── SQL filters: price_cents, category, availability, attributes
    ├── Direct retailer URLs pre-resolved (no second API call needed)
    └── Returns enriched result objects[] (same schema as Data Agent contract)
    ↓ miss or <3 results
SerpAPI live fallback (write-through to Redis on hit)
    ↓
Reasoning Agent (Daniel) — continued
    ├── Utility scoring against soft preference vector (D5-full)
    ├── Intent-match explanation generation (per top 3 results) (D6)
    └── Constraint relaxation if results sparse (D7)
    ↓
UI (Eric)
    └── Orb voice interface + Result cards with explanations
```

### Catalog Architecture (Phase 2 — Kevin leads)

**Ingestion pipeline (offline batch, never real-time):**
```
DataForSEO Merchant API (async Standard queue ~$1/1K)
    → Products endpoint (title, price, rating, images, product_id)
    → Sellers endpoint per product_id (direct retailer URLs)
    → Ad URL endpoint for any remaining aclk tokens ($0.000001/URL)
    → Normalize + dedupe + embed (OpenAI text-embedding-3-small)
    → Write to Postgres products + product_pricing tables
    → Refresh price/availability nightly for top 1K SKUs
```

**Retrieval path (real-time):**
```
Redis (Upstash) → cache-aside, intent hash key, 1h TTL on results
    ↓ miss
Postgres+pgvector → HNSW similarity + SQL filters
    ↓ miss or stale (>7 days)
SerpAPI live call → write-through to Redis + async enqueue catalog refresh
```

**Schema split (stable content vs volatile pricing):**
- `products` — title, description, image_url[], category_id (ltree), attributes (JSONB), embedding (halfvec 1536), tsvector, content_hash
- `product_pricing` — product_id, merchant, price_cents, sale_price_cents, availability, affiliate_url, refreshed_at, stale_after
- `price_history` — append-only, monthly-partitioned
- `categories` — ltree path, slug, parent_id

**Retailer priority (fashion-specific, ranked by affiliate rate + brand fit):**
```
amazon.com, nordstrom.com, macys.com, zappos.com, asos.com,
revolve.com, abercrombie.com, anthropologie.com, urbanoutfitters.com,
gap.com, hm.com, zara.com, target.com, walmart.com
```
- DataForSEO is **async-only** (even Priority queue ~1 min). Never call it on the real-time query path. Batch ingestion only.
- pgvector HNSW is chosen over IVFFlat — better for dynamic catalogs (no retraining on insert).
- Qdrant is **not** being used for Phase 2. pgvector on Supabase is the decision — one DB, ACID price updates, half the ops surface area. Revisit Qdrant only if catalog exceeds 1M products.
- Direct retailer URLs are resolved **at ingest time** (Sellers endpoint), not at query time. This is what eliminates the SerpAPI immersive call per session.

---

### Handoff Contract (Daniel ↔ Kevin) — MUST NOT CHANGE without both agreeing

**Reasoning Agent → Data Agent (query object):**
```typescript
{
  hard_constraints: {
    category?: string;
    budget_ceiling?: number;
    budget_floor?: number;
    must_have_attributes?: string[];
    in_stock_required?: boolean;
    size?: string;                          // e.g. "medium", "size 8", "32x30"
    gender_presentation?: "mens" | "womens" | "unisex";
  };
  soft_preferences: {
    aesthetic?: string;                     // e.g. "quiet luxury", "coastal", "streetwear", "minimalist"
    occasion?: string;                      // e.g. "wedding guest", "office", "date night", "gym"
    vibe_keywords?: string[];
    brand_sensitivity?: "low" | "medium" | "high";
    quality_priority?: "low" | "medium" | "high";
    fit_preference?: string;               // e.g. "oversized", "slim", "relaxed", "tailored"
    color_palette?: string[];              // e.g. ["neutral", "earth tones"] or ["black", "white"]
    season?: string;                       // e.g. "summer", "fall", "transitional"
    style_avoid?: string[];               // e.g. ["no logos", "nothing too casual"]
  };
  search_query: string;
  session_id: string;
}
```

**Data Agent → Reasoning Agent (enriched result object per product):**
```typescript
{
  product_name: string;
  price: number;
  in_stock: boolean;
  url: string;           // MUST be a direct retailer URL (e.g. amazon.com/dp/..., target.com/p/...)
                         // NEVER a google.com/shopping URL -- affiliate links require direct retailer URLs
                         // Phase 2: resolved at ingest time from DataForSEO Sellers endpoint
                         // Phase 2 fallback: SerpAPI immersive (resolveTop3Urls) for live misses
  image_url: string;
  retailer: string;
  retailer_sku: string;        // keep for future closed-ecosystem fulfillment
  specs: Record<string, string>;           // fashion attributes: gender, sizes_available, colors, fit, material, occasion[], season[]
  review_signals: {
    quality_signal: string;
    fit_signal: string;
    value_signal: string;
    avg_rating: number;
    review_count: number;
  };
  constraint_satisfaction: {
    hard_constraints_met: boolean;
    soft_preference_score: number | null;  // null until Reasoning Agent scores it
  };
  sparse_result_flag?: {
    constraint_failed: string;
    fallback_available: boolean;
  };
}
```

---

### Critical Constraint: Context Management
The intent extraction system **must** receive the full conversation history on every turn. A message like "only show gaming ones" has zero meaning without prior context. **Root cause identified and fixed (2026-03-15):** the intent extraction function was previously not being passed conversation history — it was operating stateless. Never strip or omit conversation history before the LLM call. This is a known past failure point.

**Second history bug found and fixed (2026-03-29):** `conversation/page.jsx` was sending `newHistory` (which already contained the current user message) to the API. `extractIntent` then also appended `userMessage` at the end of the message array. Result: every user message appeared twice in the LLM context, corrupting turn structure. Fix: send `priorHistory` (snapshot before adding current message) to the API. `extractIntent` appends the current message exactly once. Do not revert this pattern.

**D3 preference accumulator (2026-03-30):** Constraint accumulation is now explicit. `accumulatedIntent` state in `page.jsx` merges `hard_constraints` and `soft_preferences` forward on every turn using inline merge logic that mirrors `mergeIntent()` in `intentExtraction.ts`. The ACCUMULATION RULE in the prompt instructs the model to reproduce all prior constraints in its output. Refinement turns (category already established) now score ≥ 0.7 by prompt rule. `accumulatedIntent` is sent to the API on every call and clears on Restart. The server-side `mergeIntent()` is exported for future use (D5 utility scoring).

---

## Key UI Components (current state — 2026-04-05)

**Landing page components (all `.jsx`, Kevin's luxury design):**
- Orb (`components/orb.jsx`) — voice input via browser `SpeechRecognition` API. VAD, TTS, full conversation loop, auto-routes to `/conversation` on successful search. MediaRecorder/ngrok pipeline preserved in commented blocks (`[KEVIN - Whisper pipeline]`) for Data Agent integration.
- Input bar (`components/inputbar.jsx`) — navigates to `/conversation?q=…` on Enter or send. **Wired.**
- Hero section (`components/hero.jsx`) — layout wrapper with orb stage.
- Navbar (`components/header.jsx`) — fixed 58px nav, shared across landing, conversation, and discover.
- Curated section (`components/curated.jsx`) — static placeholder, not a real result component.

**Discover page (`app/discover/page.jsx`):**
- 4 curated sections (Trending in Tech, Popular in Home, Top Picks in Style, Trending in Wellness) fetched in parallel via `Promise.all` against `/api/search`. Loading skeletons per section. "Talk to Pine →" CTA routes to `/`.

**Conversation page (`app/conversation/page.jsx`) — fully wired to `/api/search`:**
- `LeftPanel.jsx` — status dot, query echo (Cormorant italic), small orb, restart/stop controls, refine chips (auto-generated from result categories; clicking submits directly to API)
- `ProductGrid.jsx` — 3 states: loading skeletons / clarification bubble (when `clarificationNeeded: true`) / 3-column product cards
- `ProductCard.jsx` — image, rank badge, price badge, category, name, description, AI recommendation slot (D6 stub), "View at [retailer]" link with **direct retailer URL** (affiliate-ready)
- `BottomBar.jsx` — nav tabs (visual only), mic button, text input wired to `handleSubmit`

**API route (`app/api/search/route.ts`):**
- Returns `{ products, chatResponse, clarificationNeeded: boolean, intent }` — `clarificationNeeded` is explicit; `intent` is the full extraction result for client-side accumulation
- Accepts `accumulatedIntent` from request body — logged for observability, will be consumed by D5
- Runs up to 3 parallel SerpAPI queries (`search_query` + `related_search_queries` from LLM) via `callSerpAPIBatch()`
- `resolveTop3Urls()` runs after D5 scoring — calls `serpapi_immersive_product_api` for top 3 products only (parallel). Products 4+ keep `product_link`.
- Price filtering applied post-resolution against `hard_constraints.budget_ceiling` / `budget_floor`
- `must_have_attributes` filter applied if present

**Prompt (`app/lib/prompts/intentExtractionPrompt.ts`):**
- D1 + D2 + D3 + D4 implemented
- `user_expertise: "novice" | "intermediate" | "expert"` — vocabulary-derived, drives clarification question style
- `related_search_queries: string[]` (0–2) — semantically adjacent alternatives to `search_query`, used by route to broaden recall
- ACCUMULATION RULE: model instructed to reproduce all prior constraints in every output
- REFINEMENT TURN RULE: confidence floor ≥ 0.7 when category + ≥1 constraint already established
- USER EXPERTISE CLASSIFICATION: per-level clarification tone (lifestyle / balanced / spec-framed)

**Deleted (were working in Phase 1):**
- `avatarsvg.tsx`, `chatpanel.tsx`, `voicemodal.tsx`, `market.tsx`, `resultspanel.tsx`, `rightpanel.tsx`, `authmodal.tsx`, `sections.tsx`, `header.tsx`, `generalheader.tsx`, `button.tsx`, `layout.tsx`
- Market page (`app/market/`) — entire route deleted.

---

## Monetization (Current)
Affiliate-first via Skimlinks + Amazon Associates. Long-term vision is a closed ecosystem where payment completes on Pine and we source direct from retailer — requires retailer agreements, payment processing (Stripe), and backend infrastructure. **Do not build payment infrastructure now.** Retailer SKU field is included in the data contract to preserve the path.

---

## Coding Conventions

- TypeScript strictly — no `any` types without justification. **Note:** Kevin's 2026-03-29 UI overhaul introduced `.jsx` components without type annotations. Whether to migrate these to TSX is an open decision (see B-05 in TODO.md).
- Keep LLM prompt logic in dedicated prompt files, not inline
- Conversation history must be passed as a typed array, not reconstructed from DOM
- When adding a feature, check `TODO.md` for the relevant backlog item and update its status
- Intent extraction output must be parsed with try/catch — fallback to flat query string on failure

---

## Auth System (Current State)
Auth system (`authmodal.tsx`, `auth.tsx`) was deleted in Kevin's 2026-03-29 UI overhaul. There is currently no auth in the app. Rebuilding auth is deferred to Phase 4 (Kevin's backend integration) — do not add placeholder auth again.

---

## Python Backend Services (Unintegrated)
- `conversation/main.py` — Whisper transcription spike. Currently superseded by browser `SpeechRecognition` API in `orb.jsx`. Original MediaRecorder/VAD code preserved in commented blocks in `orb.jsx` with `[KEVIN - Whisper pipeline: restore for Data Agent integration]` markers — Kevin may restore for production voice quality.
- `evidence-finder/main.py` — FastAPI debate research service. Separate product. Do not touch.

---

## What NOT to Do

- Do not return non-fashion products in search results — Pine is a fashion assistant. Electronics, home goods, sporting equipment, and beauty are out of scope until explicitly re-scoped post-funding.
- Do not pivot product scope mid-session without flagging as a strategic decision
- Do not silently drop conversation history to simplify a function
- Do not add new dependencies without noting them here
- Do not implement Plan Mode features until Shop Mode Level 4 core is stable
- Do not use localStorage auth as a model for real auth
- Do not change the Daniel↔Kevin handoff contract schema without both agreeing
- Do not remove SerpAPI fallback until Kevin's catalog is demonstrably stable and hit rate >80%
- Do not call DataForSEO on the real-time query path — it is async-only and incompatible with synchronous response pipelines. Batch ingestion only.
- Do not use Qdrant for Phase 2 catalog — pgvector on Supabase is the decided architecture. Raise a flag if catalog exceeds 1M products and revisit then.
- Do not store product images as bytes — store URLs only. Use Cloudflare R2 proxy if caching is needed.
- Do not re-embed products on price updates — embeddings regenerate only when content_hash changes.

---

## Daniel's Workflow Pattern

- **Browser Claude (this project)** — strategy, architecture, PRD drafting, investor materials, PM decisions
- **Claude Code (IDE)** — feature implementation, debugging, code generation

Keep these contexts separate.

---

## Session Startup Checklist

1. Read `PLAN.md` — current phase and priorities
2. Read `TODO.md` — active, in-progress, and blocked items
3. Confirm session goal with Daniel before writing code
4. After session, update `TODO.md` with status changes per auto-update rule

---

## Auto-Update Rule (MANDATORY)

After completing **any** task, update `TODO.md`:
- ✅ Completed — move finished items with today's date
- 🔴 Blocked — move blockers with one-line description
- 🟡 In Progress — add short note on current state
- ⚪ Backlog — add any newly discovered tasks

After **significant** sessions (new feature shipped, architecture changed, strategic decision made), also update `PLAN.md`:
- Check off completed phase items
- Add a row to the Strategic Decisions Log
- Update `_Last updated_` date

> When Daniel pastes updated file contents into Browser Claude, that is the sync point. Keep these files accurate — they are the single source of truth.