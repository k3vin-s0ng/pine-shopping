# Pine — Product Roadmap

_Last updated: 2026-04-23 (K-catalog-2 normalize step: merchant cap, delivery field extraction, last_queried_at demand tracking. ProductCandidate abstraction + D5-interim scoring unified across catalog and SerpAPI. Embeddings client bug fixed.)_

---

## Current Phase: Level 4 Architecture — 2-Week Sprint (Character Capital Deadline)

The goal is to upgrade Pine from Level 3.5 (single intent extraction call + SerpAPI) to Level 4/4.5 on the DME framework — a reasoning-first conversational shopping engine with structured intent, multi-turn clarification, utility scoring, and explanation generation. **Phase 2 now includes the product catalog index as a hard prerequisite for eliminating per-query SerpAPI costs and enabling full D5 utility scoring.**

---

## DME Level Framework (Reference)

| Level | Description | Pine Status |
|---|---|---|
| 1 | Pre-programmed, user does everything | — |
| 2 | Limited prompting, general comparisons | — |
| 3 | General comparisons, shortlists from query, user still picks | ChatGPT |
| 3.5 | Internet access, tailored answers, variable success | **Pine today** |
| 4 | Industry-specific data, streamlines transaction process | **Target** |
| 4.5 | Confident single recommendation, bundle coherence, expertise adaptation | **Stretch** |
| 5 | Full end-to-end automation, bundle creation, payment | Post-funding |

---

## Phase 1 — MVP (Partially Reset — See Note)

> **⚠️ UI Reset (2026-03-29):** Kevin replaced the entire TypeScript component layer with a new luxury JSX redesign. All conversational UI components (chat panel, voice modal, auth modal, product cards, results panel, agent avatar, marketing sections) were deleted. The API route and LLM logic are intact, but the new UI stubs (`orb.jsx`, `inputbar.jsx`) are not connected to the pipeline. Phase 1 UI work must be rebuilt within the new design system.

- [x] LLM integration via OpenRouter (GPT-4o-mini) — API route intact
- [x] SerpAPI Google Shopping integration — API route intact
- [ ] ~~React conversational UI (avatars, bubbles, product cards, voice modal, auth modal)~~ — **DELETED in Kevin's UI overhaul**
- [x] Conversation context passed correctly to intent extraction — logic intact
- [x] Price-based follow-up refinement working end-to-end — logic intact
- [ ] ~~Clarification path built (`shouldSearch: false` → chat message)~~ — **DELETED (chatpanel gone)**
- [ ] ~~Error state handling with mock product fallback~~ — **DELETED (chatpanel gone)**

---

## Phase 2 — Level 4 Reasoning Agent + Product Catalog (Current Sprint)

**Exit criteria:** Pine extracts structured fashion intent (including fit, occasion, aesthetic, size, color palette), scores confidence, asks smart clarifying questions when needed, scores results against a fashion preference vector, and explains why each recommendation matches. Retrieval cost is decoupled from query volume via the catalog layer. Catalog covers fashion categories only: apparel, footwear, accessories, outerwear.

> **Affiliate feed integration (Skimlinks Data Pipe, Impact.com, CJ Affiliate)** to be scoped in Phase 2 alongside catalog build. Eliminates DataForSEO refresh cost on covered merchants. Skimlinks relationship already active — Data Pipe requires separate application.

### Daniel — Reasoning Agent + API + Product Catalog

- [x] D1: Structured intent extraction → `{ hard_constraints, soft_preferences, confidence_score, clarification_needed }`
- [x] D2: Intent confidence scoring (0.0–1.0 threshold gates clarification vs. search)
- [x] D3: Multi-turn clarification loop — preference accumulator (`accumulatedIntent`) merges constraints across turns
- [x] D4: Dialog adaptation by user expertise level — `user_expertise` field + USER EXPERTISE CLASSIFICATION section in prompt
- [x] **D5-interim: Lightweight utility scoring (SerpAPI fields only)** — `scoreProduct()` + `scoreAndRankProducts()` wired into route. _(Complete 2026-04-12)_
- [ ] D5-full: Full utility scoring against Kevin's K5 enriched result objects — fashion attributes (fit, material, occasion, season, color), review_signals, structured specs. Blocked on D-catalog-1 + K5.
- [x] D6: Intent-match explanation generation per top 3 results — `generateExplanations()` wired to `ProductCard`. Explanation language to be updated for fashion vocabulary (fit, occasion, aesthetic) once fashion intent fields are wired through.
- [ ] D7: Constraint relaxation logic when Data Agent returns sparse results
- [ ] D8: Confident single recommendation mode (when top result significantly outscores others)
- [x] **D9: SerpAPI → Serper → SerpAPI (reverted 2026-04-15)** — Serper cannot resolve direct retailer URLs. SerpAPI reinstated. Serper code preserved in `[SERPER - D9]` comment blocks.
- [x] **D10-partial: Top-3 direct URL resolution via SerpAPI immersive endpoint** _(Complete 2026-04-15)_ — `resolveTop3Urls()` fires 3 parallel SerpAPI immersive calls after D5 scoring. Products 4+ keep `product_link`. Full elimination of this call is D10-full, blocked on D-catalog-1.
- [x] **D-catalog-retrieve: Catalog-first retrieval wired in route.ts** _(Complete 2026-04-21)_ — `retrieveFromCatalog()` queries Supabase via `match_products` RPC (pgvector cosine similarity ≥ 0.72), joins `product_pricing` for in-stock URLs, applies hard constraint filters, returns `Product[]` or null. `generateQueryEmbedding()` uses dedicated `embeddingsClient` with `OPENAI_API_KEY` (OpenRouter does not support embeddings — fix applied 2026-04-23). POST handler tries catalog first; SerpAPI fallback path and all downstream pipeline unchanged. Requires `match_products` SQL function in Supabase — see session brief for SQL.
- [x] **K-catalog-2: Normalize step** _(Complete 2026-04-23)_ — Merchant cap (`MAX_MERCHANTS_PER_PRODUCT = 3`) enforced before any DB write; sellers sorted Amazon/trusted-first → rating desc → price asc. `parseDelivery()` extracts `shipping_cents`, `delivery_message`, `delivery_date_min`, `delivery_date_max` from DataForSEO seller items; `extractDeadlineDate()` parses common delivery message formats as fallback. `last_queried_at` fire-and-forget update on served product IDs in `retrieveFromCatalog()`. Requires `last_queried_at` column on `products` table (migration in K-catalog-2 spec) and four delivery columns on `product_pricing` (migration already ran in Supabase). **Re-ingest complete:** Cleanup SQL ran against existing 605 pricing rows — trimmed to max 3 merchants per product. Re-ingest completed with shipping + delivery fields now populated.
- [x] **ProductCandidate abstraction + unified D5 scoring** _(Complete 2026-04-23)_ — `ProductCandidate` type wraps `Product` with `source` (catalog/serpapi/data_agent), `retrieval` (similarity, queryRank), and `enriched` (constraint satisfaction, review signals). `scoreCandidate()` replaces `scoreProduct()` — D5-interim scoring now runs on both catalog and SerpAPI results via a single `scoreAndRankCandidates()` pass. Catalog similarity feeds as a tie-breaking signal. `resolveTop3SerpAPICandidates()` only resolves URLs for SerpAPI candidates (catalog already has direct retailer URLs).
- [x] **Fashion intent fields extended** _(Complete 2026-04-21)_ — `IntentExtractionResult` now includes `size`, `gender_presentation` (hard constraints) and `fit_preference`, `color_palette`, `season`, `style_avoid` (soft preferences). `mergeIntent()` accumulates `color_palette` and `style_avoid` as sets. FASHION CONTEXT section added to prompt with per-field extraction rules and 6 worked examples.

### Kevin — Data Agent + Reddit Reviews Database

> **Workstream reassignment (2026-04-18):** Kevin's Phase 2 focus is the Reddit reviews database — batch scraping community recommendation signals from category-relevant subreddits and storing them as structured `review_signals` in the catalog. Product catalog ingestion is now Daniel's workstream. Kevin remains owner of the Data Agent (K1–K7) and the SerpAPI fallback path.

> **Workstream split reminder (2026-04-10):** Product catalog index (Phase 2) and user database (Phase 4) are distinct systems. Do not conflate.

- [ ] **K-reddit-1: Subreddit scope + scraping pipeline** — Fashion-specific subreddits: r/femalefashionadvice, r/malefashionadvice, r/frugalmalefashion, r/streetwear, r/buyitforlife (for quality signals on accessories/outerwear). Build batch scraper: top posts (all-time + past year) + comments → extract product mentions, brand names, sentiment. Not real-time — scheduled batch, run weekly.
- [ ] **K-reddit-2: Structured signal extraction** — Parse raw scraped text into structured `review_signals`: `{ product_name, brand, subreddit, sentiment, mention_count, community_label, post_url }`. LLM-assisted extraction acceptable; deterministic fallback on parse failure.
- [ ] **K-reddit-3: Schema + storage in Supabase** — Store extracted signals in a `reddit_signals` table keyed by normalized product name + brand. Join to `products` table via fuzzy match on title. Signals feed into D5/D6 explanation generation as social proof layer (e.g. "highly recommended by r/BuyItForLife").
- [ ] **K-reddit-4: Signal freshness + re-scrape cadence** — Weekly re-scrape for top subreddits, monthly for long-tail. Append-only inserts with `scraped_at` timestamp — do not overwrite prior signals.
- [ ] K1: Structured query intake contract (agree schema with Daniel — already defined in CLAUDE.md)
- [ ] K2: Retailer scraping layer (Amazon + Target + 1 category-specific retailer)
- [ ] K3: Product page fetch + structured data extraction (price, stock, specs, image, URL)
- [ ] K4: Review signal extraction → `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`
- [ ] K5: Enriched result object construction (combines K3+K4 into typed JSON per product)
- [ ] K6: Sparse result flag when <3 viable products satisfy hard constraints
- [x] K8: Direct retailer URL resolution — now handled at ingest time via DataForSEO Sellers endpoint. `resolveRetailerUrls()` immersive call (cost-prohibitive at scale) replaced by `resolveTop3Urls()` for live fallback path only.
- [x] Adjacent search queries — `related_search_queries` field in intent schema + prompt, `buildSearchQueries()` + `callSerpAPIBatch()` in route, up to 3 parallel queries per turn.
- [ ] K7: SerpAPI silent fallback when catalog returns zero results or fails — fires when catalog + Redis miss. Write-through to Redis on fallback hit. Flag `affiliate_degraded: true` if URL is not a direct retailer link.
- [ ] **K-catalog-5: Demand-driven price refresh cron** — Weekly cron: `SELECT products WHERE last_queried_at > now() - interval '7 days'`. Refresh only hot products via DataForSEO Sellers endpoint. At 50K products, realistic hot set is 2K–5K = ~$2–5/week vs $150/week full-catalog. Blocked on K-catalog-2 full batch completing.

### Eric — Voice + UI
- [x] E1: Voice input — `orb.jsx` uses browser `SpeechRecognition` API. Auto-routing complete.
- [x] E2: Orb UI state machine — idle / listening / processing / speaking all implemented.
- [x] E3: Voice output via Inworld TTS — `speakWithInworld` in `inworldTTS.ts` proxied through `/api/tts`.
- [x] E4: Result cards with intent-match explanation display — `ProductCard.jsx` + `ProductGrid.jsx` live; D6 explanation fully wired.
- [x] E5: Typing fallback input — `inputbar.jsx` navigates to `/conversation`, `BottomBar.jsx` submits follow-ups to API

### Shared
- [ ] Daniel↔Kevin handoff contract locked (query object + enriched result object schemas)
- [ ] Integration test: full voice → intent → catalog → scoring → explanation → display

---

## Phase 3 — Plan Mode Alpha

Only begin after Phase 2 exit criteria are met.

**Goal:** User describes a scenario ("dorm room setup, $500 budget") and gets a coherent multi-item bundle with explanation and affiliate links.

- [ ] Plan Mode toggle in UI
- [ ] Bundle intent extraction prompt chain
- [ ] Bundle coherence scoring (items scored as a set, not just individually)
- [ ] Multi-item result display
- [ ] Plan summary card component

---

## Phase 4 — User Database + Personalization

> **Scope clarification (2026-04-10):** The product catalog index has been moved to Phase 2. Phase 4 "database" now refers exclusively to the user-facing persistence layer — sessions, preferences, auth. These require Kevin's backend infrastructure and are deliberately deferred.

- [ ] Kevin's user database schema design and API
- [ ] User session persistence across visits
- [ ] Preference signals from past searches inform future recommendations
- [ ] Replace localStorage auth with real auth (Kevin's backend)
- [ ] Personalization layer for Discover page (preset SerpAPI queries → personalized catalog queries)
- [ ] Reddit enrichment signal — _(Moved to Phase 2 as K-reddit-1 through K-reddit-4 under Kevin. Fashion subreddits: r/femalefashionadvice, r/malefashionadvice, r/frugalmalefashion, r/streetwear, r/buyitforlife.)_
- [ ] Apply to affiliate networks in parallel — Impact.com, CJ Affiliate, Awin, ShareASale, Rakuten Advertising. Free bulk product catalogs in XML/CSV via FTP/API once approved. 3–6 month approval timeline — start application process during Phase 2.

---

## Phase 5 — Closed Ecosystem (Post-Funding Vision)

The long-term product vision is payment completing on Pine with direct retailer sourcing. **Do not build now.** Prerequisites: retailer dropshipping/wholesale agreements, Stripe business integration, order management service, returns handling, tax compliance. The `retailer_sku` field in Kevin's data contract preserves the path to this.

- [ ] Retailer partnership agreements (business development)
- [ ] Stripe payment integration
- [ ] Order management service (Kevin)
- [ ] Retailer fulfillment bridge
- [ ] Order tracking + customer communication
- [ ] Returns and dispute handling

---

## Phase 6 — Growth & Distribution

- [ ] User personas validated with real users
- [ ] Onboarding flow
- [ ] Referral / sharing of Plans
- [ ] Analytics instrumentation
- [ ] Retailer partnership tier (brands pay for placement)
- [ ] Premium Plan Mode subscription tier

---

## Strategic Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03 | Dual-mode (Shop + Plan) instead of full pivot | Preserves MVP scope while accommodating Eric's multi-item vision |
| 2026-03 | OpenRouter + GPT-4o-mini over self-hosted model | Speed and cost for MVP stage |
| 2026-03-15 | Client-side price refinement short-circuit | Reduces API calls for simple price filters |
| 2026-03-15 | Browser Speech Recognition API for voice (no Whisper) | Zero infra cost, no Docker bloat, Chrome/Edge native |
| 2026-03-15 | Auth in localStorage (btoa) | MVP placeholder only — not production-safe |
| 2026-03-25 | Rejected travel pivot | CAC problem, Google entering directly, structural unit economics worse than shopping |
| 2026-03-25 | Rejected prediction market / startup investment platform | SEC Reg CF compliance, FINRA registration required — different business entirely |
| 2026-03-25 | Affiliate-first monetization (Skimlinks + Amazon Associates) | Zero friction for users, proves intent translation at scale, closed ecosystem is Series A goal |
| 2026-03-25 | Voice-first UI with text as equal fallback | Voice signals differentiation visually; text parity required for real-world usage contexts |
| 2026-03-25 | Structured intent extraction (hard constraints + soft preferences) | Foundation for Level 4 DME architecture — all downstream features depend on this |
| 2026-03-25 | Kevin builds Data Agent from existing scraping agent | Replaces SerpAPI with direct retailer data for real pricing, stock, and review signals |
| 2026-03-25 | SerpAPI retained as silent fallback | Insurance against catalog misses; demoted from primary to fallback once catalog hit rate >80% |
| 2026-03-25 | Closed ecosystem payment deferred post-funding | Requires retailer agreements, legal setup, Stripe business account — not 2-week scope |
| 2026-03-25 | retailer_sku included in K5 data contract | Preserves path to closed fulfillment without building it now |
| 2026-03-25 | Rebranded Sicero → Pine | Navy/gold color scheme, gold pinecone logo |
| 2026-03-29 | Kevin replaced all TSX components with new luxury JSX UI | New design direction: Playfair Display/Cormorant Garamond fonts, orb-centric layout, premium aesthetic. All conversational UI deleted. New stubs need to be wired to LLM pipeline. TypeScript dropped for JSX in component layer. Market page removed. |
| 2026-03-29 | Conversation page (`/conversation`) built and wired to `/api/search` | `LeftPanel`, `ProductCard`, `ProductGrid`, `BottomBar` all live. History passes correctly on every turn. Two bugs found and fixed: clarification bubble mis-trigger and user-message duplication in LLM context. |
| 2026-03-29 | History duplication root cause identified | `newHistory` (containing current message) was sent to API; `extractIntent` then appended the same message again. Fixed by sending `priorHistory` to API. |
| 2026-03-30 | D3 preference accumulator made explicit via mergeIntent | Previously constraints carried forward by accident via history re-reading — unreliable if LLM missed a detail. Now `accumulatedIntent` state explicitly unions `hard_constraints` and `soft_preferences` across turns. |
| 2026-03-30 | D4 expertise classification added | `user_expertise` ("novice" / "intermediate" / "expert") derived from vocabulary, not confidence score. Drives clarification question tone. |
| 2026-03-31 | Intent pivot detection added to schema and prompt | `is_pivot: boolean` added to `IntentExtractionResult`. On pivot, both `accumulatedIntent` and conversation history reset. |
| 2026-03-31 | Price filter fallback added to route | When budget/attribute filters eliminate all results, `route.ts` returns unfiltered products with explanatory message. |
| 2026-04-05 | Affiliate URL resolution via `serpapi_immersive_product_api` | `resolveRetailerUrls()` implemented but disabled at scale — 3×3×n call pattern is cost-prohibitive. Interim: Skimlinks wraps whatever URL is returned. |
| 2026-04-05 | Adjacent search queries added to intent schema | `related_search_queries: string[]` (0–2 entries). Route runs up to 3 parallel queries, merges and deduplicates. |
| 2026-04-05 | Confidence scoring overhaul | Replaced vague bucket-based self-assessment with deterministic additive rubric (5 slots: Category 30, Specificity 25, Price 20, Attributes 15, Context 10). Expertise-adjusted thresholds. |
| 2026-04-05 | D6 scoped to SerpAPI-only explanation generation for demo | `generateExplanations()` fires in parallel with search using only `raw_intent_summary`. Quality improves when Kevin's enriched result objects are available. |
| 2026-04-07 | Orb halo animation, Inworld TTS, session state reset | Multiple UX polish items completed. |
| 2026-04-10 | Placeholder cycling animation + ldrs dotPulse orb loader | PLACEHOLDERS array cycles 8 phrases every 1500ms with CSS fade while processing. ldrs `<l-dot-pulse>` replaces waveform bars during `isProcessing`. |
| 2026-04-10 | pineHandoff extended to carry products array | Eliminates conversation page mount flash — hydrates state directly from handoff without second API call. |
| 2026-04-10 | SerpAPI → Serper.dev switch decided (D9) | _(Subsequently reverted — see 2026-04-15)_ |
| 2026-04-10 | DataForSEO Merchant API rejected for real-time path | Async-only (task POST → task GET polling) — fundamentally incompatible with Pine's synchronous response pipeline. `url` field is null in shopping product listings; direct retailer URLs require separate Sellers endpoint call. Assigned to batch mode for Kevin's catalog ingestion instead. |
| 2026-04-10 | Skimlinks wired as interim affiliate (D10) | Drops `resolveRetailerUrls()` immersive call entirely, cutting session API calls from 27 → 9. Skimlinks wraps SerpAPI URLs and attempts attribution — degrades gracefully. Full affiliate accuracy restored when Kevin's catalog provides direct retailer URLs as first-class field. |
| 2026-04-11 | Top-3 URL resolution via SerpAPI immersive endpoint (D10-partial) | `resolveTop3Urls()` fires 3 parallel SerpAPI immersive calls after D5 scoring. Top 3 only. Products 4+ degrade gracefully. Full resolution replaced by catalog direct URLs (D10-full) once D-catalog-1 is live. |
| 2026-04-10 | Product catalog index moved to Phase 2 | "Kevin's database" was collapsed into one Phase 4 line item covering both catalog retrieval and user persistence. These are different systems. Catalog index is Phase 2 — it unblocks cheap retrieval, direct URLs, and D5. User database stays Phase 4. |
| 2026-04-10 | API economics modeled — own database confirmed as only architecture where costs don't scale with usage | At 5K MAU: SerpAPI ~$405/mo API cost vs. $506 affiliate revenue (20% margin). Own DB: ~$40/mo fixed regardless of MAU (92% margin). |
| 2026-04-12 | D5-interim shipped using SerpAPI fields only | Top 3 ordering must reflect user intent, not SerpAPI's native ranking. Hard constraint violations deprioritised with -100 penalty. Attribute and keyword title matches rewarded. Rating weighted by quality_priority. Full D5 deferred to Phase 2 pending K5. |
| 2026-04-15 | Reverted SerpAPI → Serper → SerpAPI. `resolveTop3Urls()` reinstated via immersive endpoint. | Serper cannot reliably resolve direct retailer URLs — `item.link` is a Google Shopping URL for most results, and `google_immersive_product` requires a `page_token` from SerpAPI's own results (not cross-compatible). SerpAPI reinstated as primary search provider. Serper code preserved in `[SERPER - D9]` comment blocks. |
| 2026-04-18 | **pgvector on Supabase chosen over Qdrant for Phase 2 catalog** | One database instead of two. ACID price updates. pgvector HNSW matches Qdrant performance at 50K products. ~75% cheaper than Pinecone. Qdrant revisited only if catalog exceeds 1M products. |
| 2026-04-18 | **DataForSEO confirmed as batch ingestion source** | Products → Sellers → Ad URL endpoint pattern resolves direct retailer URLs at ingest time (~$0.001/product). Organic results return direct URLs; sponsored results resolved via Ad URL endpoint at $0.000001/URL (effectively free). Async latency (~1 min even Priority) is irrelevant for batch — this is the right fit. |
| 2026-04-18 | **Redis (Upstash) added as cache layer** | Cache-aside in front of Postgres. 1h TTL on result sets. Targets 40–60% hit rate on repeat queries. Write-through on every SerpAPI fallback hit. ~$10/mo to start (free tier). |
| 2026-04-18 | **SerpAPI demoted to live fallback** | SerpAPI is not being replaced — it is being demoted. Fires only on catalog+Redis miss. Estimated fallback rate at steady state: 20–30% of queries. Removes SerpAPI from the per-query cost model for the majority of traffic. |
| 2026-04-21 | **Fashion intent fields added to schema and prompt** | `hard_constraints` now captures `size` and `gender_presentation`; `soft_preferences` captures `fit_preference`, `color_palette`, `season`, `style_avoid`. FASHION CONTEXT section in prompt maps natural language cues ("flowy beach wedding" → season: summer, fit_preference: flowy) to these fields. `mergeIntent()` accumulates array fields across turns. Enables D5-full to score on fashion-specific attributes once K5 enriched objects are available. |
| 2026-04-21 | **Catalog-first retrieval active in route.ts** | `retrieveFromCatalog()` attempts pgvector similarity search (threshold 0.72, min 3 results) before SerpAPI. Supabase client is lazy-init — missing env vars silently disable catalog path and SerpAPI serves all requests. Threshold set lower than the 0.82 mentioned in 2026-04-19 entry — adjusted to account for early catalog sparsity. Revisit upward as catalog grows. Redis write-through deferred to D-catalog-4. |
| 2026-04-23 | **Embeddings client bug fixed** | `generateQueryEmbedding()` was calling `openai.embeddings.create()` on the OpenRouter-configured client. OpenRouter does not support the embeddings API — every catalog embedding call silently failed and fell through to SerpAPI. Fix: dedicated `embeddingsClient` using `OPENAI_API_KEY`. |
| 2026-04-23 | **ProductCandidate abstraction + unified D5 scoring** | `ProductCandidate` wraps `Product` with `source`, `retrieval`, and `enriched` slots. D5-interim (`scoreCandidate`) now runs uniformly on catalog and SerpAPI results. Catalog similarity score feeds as a tie-breaking input. Prepares the slot for K5 enriched objects (constraint satisfaction, review signals) without a second refactor. |
| 2026-04-23 | **K-catalog-2 normalize step shipped** | Merchant cap (3 per product), delivery field extraction (`shipping_cents`, `delivery_message`, `delivery_date_min/max`), `last_queried_at` demand tracking (fire-and-forget on served IDs). Cap enforced before DB write — `product_pricing` stays lean regardless of how many sellers DFSEO returns. |
| 2026-04-23 | **Merchant cap set to 3** | `MAX_MERCHANTS_PER_PRODUCT = 3`. Seller priority: fashion-native retailers (Nordstrom, ASOS, Revolve, Shopbop, SSENSE, Farfetch) ranked first, then by price asc. Amazon removed as default — wrong fit for fashion vertical. |
| 2026-04-23 | **Demand-driven price refresh** | Weekly refresh cron will filter `WHERE last_queried_at > now() - interval '7 days'`. Full-catalog refresh is unviable at scale. `last_queried_at` fires from catalog retrieval path only (not ingest), non-blocking. |
| 2026-04-23 | **Affiliate feed integration promoted to Phase 2** | Moved from Phase 4 to Phase 2 planning. Skimlinks Data Pipe + Impact.com + CJ Affiliate to be scoped alongside catalog build. Eliminates DataForSEO refresh cost on covered merchants. Skimlinks relationship already active — Data Pipe requires separate application. |
| 2026-04-19 | **Pine scoped to fashion niche only** | General shopping is too broad for a defensible catalog, a compelling demo, or expert-feeling recommendations. Fashion (apparel, footwear, accessories, outerwear) has high AOV, strong affiliate rates, enthusiastic early adopters, and a tractable catalog size. Out of scope until post-funding: electronics, home goods, sporting equipment, beauty. Downstream changes: retailer priority updated to fashion retailers, seed queries replaced with fashion queries, intent schema extended with fit/occasion/aesthetic/size/color_palette/season/style_avoid fields, D6 explanation language to use fashion vocabulary, Kevin's Reddit subreddits updated to r/femalefashionadvice, r/malefashionadvice, r/frugalmalefashion, r/streetwear, r/buyitforlife. |
| 2026-04-19 | **Catalog retrieval threshold set at cosine similarity ≥ 0.82 + minimum 3 results** | Below this threshold the HNSW index is reaching — catalog doesn't have good matches. Fall through to SerpAPI live call. Threshold is tunable as catalog grows. Prevents a small catalog from returning confidently wrong results. |

---

## Open Strategic Questions

- Which fashion retailers and sub-categories does Daniel target first for catalog seed queries? Recommendation: Nordstrom + ASOS + Amazon for retailers; women's dresses, men's casualwear, footwear, outerwear for categories. **(Daniel decision — blocks D-catalog-3 and D-catalog-2. Decide this week.)**
- What is the primary user persona for Shop Mode? Fashion-forward woman 22–35? Style-conscious man 18–30? Both? (still needs definition — U-01)
- At what point does Kevin's user database become essential vs. nice-to-have?
- Which affiliate networks to apply to first? (Impact.com, CJ Affiliate, Awin recommended — long lead time, start now. Fashion brands often have better rates on these than Amazon Associates.)