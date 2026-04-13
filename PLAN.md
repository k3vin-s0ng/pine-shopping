# Pine — Product Roadmap

_Last updated: 2026-04-12 (D5-interim shipped — lightweight utility scoring on Serper fields; D5-full deferred to Phase 2 pending K5)_

---

## Current Phase: Level 4 Architecture — 2-Week Sprint (Character Capital Deadline)

The goal is to upgrade Pine from Level 3.5 (single intent extraction call + SerpAPI) to Level 4/4.5 on the DME framework — a reasoning-first conversational shopping engine with structured intent, multi-turn clarification, utility scoring, and explanation generation.

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

**Exit criteria:** Pine extracts structured intent, scores confidence, asks smart clarifying questions when needed, scores results against a preference vector, and explains why each recommendation matches. Retrieval cost is decoupled from query volume.

### Daniel — Reasoning Agent + API

- [x] D1: Structured intent extraction → `{ hard_constraints, soft_preferences, confidence_score, clarification_needed }`
- [x] D2: Intent confidence scoring (0.0–1.0 threshold gates clarification vs. search)
- [x] D3: Multi-turn clarification loop — preference accumulator (`accumulatedIntent`) merges constraints across turns; ACCUMULATION RULE + refinement-turn confidence floor added to prompt
- [x] D4: Dialog adaptation by user expertise level — `user_expertise` field + USER EXPERTISE CLASSIFICATION section in prompt; clarification question style adapts per level
- [x] **D5-interim: Lightweight utility scoring (Serper fields only)** — `scoreProduct()` + `scoreAndRankProducts()` wired into route. Budget hard violation -100, attribute/keyword title match, quality-priority-weighted rating, review volume trust signal, query origin weight. _(Complete 2026-04-12)_
- [ ] D5-full: Full utility scoring against Kevin's K5 enriched result objects — specs, review_signals, structured attributes. Blocked on K-catalog-1 + K5.
- [x] D6: Intent-match explanation generation per top 3 results — `generateExplanations()` wired to `ProductCard` via `reason` prop
- [ ] D7: Constraint relaxation logic when Data Agent returns sparse results
- [ ] D8: Confident single recommendation mode (when top result significantly outscores others)
- [x] **D9: Swap SerpAPI → Serper.dev** — `callSerpAPI()` rewritten, `mapSerperResult()` added, `SERP_API_KEY` decommissioned. Synchronous, 80% cheaper per call. _(Complete 2026-04-10)_
- [ ] **D10: Wire Skimlinks as interim affiliate layer** — wrap Serper product URLs via Skimlinks. Removes `resolveRetailerUrls()` / immersive product call entirely in interim, cutting session call count from 27 → 9. Affiliate attribution degrades gracefully until Kevin's catalog provides direct retailer URLs. _(New — 2026-04-10)_

### Kevin — Data Agent + Product Catalog Index

> **Architecture note (2026-04-10):** Kevin's database workstream has been split into two distinct deliverables with different timelines. The **product catalog index** is Phase 2 infrastructure — it unblocks cheap retrieval, direct affiliate URLs, and D5. The **user database** (session persistence, personalization, auth) stays in Phase 4. These are different systems. Do not conflate them.

- [ ] **K-catalog-1: Product catalog index (Phase 2 — NOW)** — Vector store of ~10K–50K products with prices, direct retailer URLs, and basic attributes. Enables sub-50ms retrieval via HNSW (Qdrant self-hosted recommended). Eliminates per-query SerpAPI/Serper costs once live. Unblocks D5 utility scoring. _(Moved from Phase 4 — 2026-04-10)_
- [ ] **K-catalog-2: Batch catalog population via DataForSEO Merchant API** — Use DataForSEO's async Merchant API in batch mode (not real-time) to discover and ingest ~50K products across 3 target retailers. DataForSEO is async-only — correct role is background ingestion, not real-time query serving. Initial catalog cost ~$15–50 one-time. _(New — 2026-04-10)_
- [ ] **K-catalog-3: Scope catalog: retailers + categories** — Decision needed with Daniel before K-catalog-2 can begin. Recommended: Amazon + Target + 1 category-specific retailer; 3–5 product categories max. Narrow and reliable beats broad and flaky for demo. _(New — 2026-04-10)_
- [ ] K1: Structured query intake contract (agree schema with Daniel — Week 1 Day 1-2)
- [ ] K2: Retailer scraping layer (Amazon + Target + 1 category-specific retailer)
- [ ] K3: Product page fetch + structured data extraction (price, stock, specs, image, URL)
- [ ] K4: Review signal extraction → `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`
- [ ] K5: Enriched result object construction (combines K3+K4 into typed JSON per product)
- [ ] K6: Sparse result flag when <3 viable products satisfy hard constraints
- [x] K8: Direct retailer URL resolution — `resolveRetailerUrls()` via `serpapi_immersive_product_api` endpoint. **Currently disabled** — SerpAPI immersive call is cost-prohibitive at scale (3×3×n calls per session). Will be reinstated natively when Kevin's catalog provides direct retailer URLs as a first-class field.
- [x] Adjacent search queries — `related_search_queries` field in intent schema + prompt, `buildSearchQueries()` + `callSerpAPIBatch()` in route, up to 3 parallel queries per turn.
- [ ] K1: Structured query intake contract (agree schema with Daniel — Week 1 Day 1-2)
- [ ] K7: SerpAPI/Serper silent fallback when catalog returns zero results or fails

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
- [ ] Personalization layer for Discover page (preset SerpAPI/Serper queries → personalized catalog queries)
- [ ] Reddit enrichment signal — scrape r/BuyItForLife, r/frugalmalefashion, r/running (3–5 category-relevant subreddits) for community product recommendations. Store as structured `review_signals` alongside catalog records. Provides "highly recommended by hiking communities" signal for D6 explanations. _(Scoped 2026-04-10 — batch pipeline, not real-time)_

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
| 2026-03-25 | SerpAPI retained as silent fallback | Insurance against scraping failures, especially during Character Capital demo |
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
| 2026-04-10 | **SerpAPI → Serper.dev switch decided (D9)** | Serper is synchronous (critical — DataForSEO Merchant is async-only, incompatible with real-time query serving), similar response schema (2 field renames), 80% cheaper per call ($1/1K vs $5/1K). DataForSEO assigned to batch catalog population role only, not real-time path. |
| 2026-04-10 | **DataForSEO Merchant API rejected for real-time path** | Async-only (task POST → task GET polling) — fundamentally incompatible with Pine's synchronous response pipeline. `url` field is null in shopping product listings; direct retailer URLs require separate Sellers endpoint call (same cost problem as SerpAPI immersive). Assigned to batch mode for Kevin's catalog ingestion instead. |
| 2026-04-10 | **Skimlinks wired as interim affiliate (D10)** | Drops `resolveRetailerUrls()` immersive call entirely, cutting session API calls from 27 → 9. Skimlinks wraps Serper URLs and attempts attribution — degrades gracefully. Full affiliate accuracy restored when Kevin's catalog provides direct retailer URLs as first-class field. |
| 2026-04-11 | **Top-3 URL resolution via Serper product detail call (D10-partial)** | `resolveTop3Urls()` fires 3 parallel Serper calls after filtering, querying by `productId` + title. Limits resolution to exactly 3 calls per turn regardless of result count. Products 4+ degrade gracefully to Google Shopping URL. Full resolution replaced by catalog direct URLs (D10-full) once K-catalog-1 is live — eliminating the second API call entirely. `product_id` added to `Product` interface to survive `transformProducts()`. |
| 2026-04-10 | **Product catalog index moved to Phase 2** | "Kevin's database" was collapsed into one Phase 4 line item covering both catalog retrieval and user persistence. These are different systems. Catalog index (vector store, ~50K products, HNSW retrieval) is Phase 2 — it unblocks cheap retrieval, direct URLs, and D5. User database (sessions, personalization, auth) stays Phase 4. |
| 2026-04-10 | **API economics modeled — own database confirmed as only architecture where costs don't scale with usage** | At 5K MAU: SerpAPI ~$405/mo API cost vs. $506 affiliate revenue (20% margin). Serper: ~$81/mo (84% margin). Own DB: ~$40/mo fixed regardless of MAU (92% margin). Own DB break-even on build cost (~$50 one-time) measured in days once live. |
| 2026-04-12 | **D5-interim shipped using Serper fields only** | Top 3 ordering must reflect user intent, not Serper's native ranking. Hard constraint violations deprioritised with -100 penalty. Attribute and keyword title matches rewarded (+20/+8). Rating weighted by quality_priority preference. Review volume as trust signal. Query origin penalises related-query results in ties. Direct URL resolution remains disabled. Full D5 deferred to Phase 2 pending Kevin's K5 enriched result objects. |
| 2026-04-10 | **Reddit data strategy clarified** | ChatGPT/LLMs don't query Reddit in real time — it's training data. For Pine: scrape 3–5 category-relevant subreddits (r/BuyItForLife, r/frugalmalefashion, etc.) in batch, extract structured product recommendation signals, store as `review_signals` in catalog. Not a real-time retrieval path. Scoped to Phase 4 enrichment layer. |

---

## Open Strategic Questions

- Which 3–5 subreddits and which 2–3 retailers does Kevin scrape first for catalog? (Daniel decision, blocks K-catalog-3)
- Which vector DB for catalog — Qdrant self-hosted ($30/mo VPS) or managed (Pinecone/Weaviate free tier)? (Kevin decision)
- What is the primary user persona for Shop Mode? (still needs definition — U-01)
- At what point does Kevin's user database become essential vs. nice-to-have?