# Pine — Active Task Board

_Updated: 2026-04-12 (D5-interim complete — lightweight utility scoring; D5-full backlogged pending K5) | Owner tags: [D] = Daniel, [K] = Kevin, [E] = Eric_

---

## 🔴 Blocked / Needs Resolution

| # | Task | Owner | Notes |
|---|---|---|---|
| B-05 | TypeScript dropped for JSX in component layer | [K]/[D] | All new components are `.jsx` with no type annotations. Breaks TypeScript-strict convention in CLAUDE.md. Decision needed: migrate new components to TSX or accept JSX for UI layer. |
| B-02 | Daniel↔Kevin Data Agent handoff contract | [D]/[K] | Schema defined in CLAUDE.md. Needs explicit agreement from Kevin before K2+ and D5+ can be built. Priority: next team meeting. |
| B-07 | Catalog scope not yet decided | [D] | Daniel must decide which 2–3 retailers and 3–5 product categories Kevin targets first for catalog ingestion. Blocks K-catalog-2 and K-catalog-3. Decision needed this week. |

---

## 🟡 In Progress

| # | Task | Owner | Notes |
|---|---|---|---|
| I-02 | Competitive research (Google Shopping AI, Perplexity Shopping, etc.) | [D]/[E] | Needed before PRD |
| K-voice | Whisper/ngrok STT pipeline restoration | [K] | MediaRecorder + Python transcription backend replaced by browser `SpeechRecognition` API in `orb.jsx`. Original MediaRecorder/ngrok code preserved in commented blocks. Decision on which to use long-term is open. |
| D-voice-gap | Voice path missing accumulatedIntent | [D] | `useConvo.ts` (voice path) does not pass `accumulatedIntent` to `/api/search`. Multi-turn constraint accumulation works correctly on `/conversation` (text path). Fix when voice and text paths are unified. Do not fix in isolation. |
| K-catalog-research | Kevin researching vector DB options and retrieval architecture | [K] | Evaluating HNSW (Faiss/Qdrant) vs. managed (Pinecone/Weaviate). Target: sub-2s retrieval. Qdrant self-hosted recommended — HNSW by default, self-hostable, $30/mo VPS for 50K products. |

---

## 🟢 Up Next (Prioritized)

### Immediate — This Week

| # | Task | Owner | Notes |
|---|---|---|---|
| ~~D9~~ | ~~Swap SerpAPI → Serper.dev in `route.ts`~~ | ~~[D]~~ | **✅ Complete 2026-04-10.** See Completed. |
| D10 | **Wire Skimlinks as interim affiliate layer** | [D] | Wrap Serper product URLs via Skimlinks JS snippet or API. Cuts session call count 27 → 9. Full affiliate accuracy returns when Kevin's catalog has direct retailer URLs. |
| B-07 | Decide catalog scope (retailers + categories) | [D] | Make this call with Kevin before he starts K-catalog-2. Block of time: 30 minutes. |

### Week 1–2 — Kevin Catalog (Phase 2)

| # | Task | Owner | Notes |
|---|---|---|---|
| K-catalog-3 | Scope: confirm target retailers + product categories | [K]/[D] | Start narrow: Amazon + Target + 1 category retailer. 3–5 categories max. Narrow and reliable beats broad and flaky for demo. |
| K-catalog-2 | Batch catalog population via DataForSEO Merchant API | [K] | Use async Merchant API in batch mode (not real-time) to discover ~50K products. DataForSEO is async-only — correct role is background ingestion only, never real-time query serving. Estimated one-time cost ~$15–50. |
| K-catalog-1 | Vector index setup (Qdrant self-hosted) | [K] | HNSW index over catalog records. 2GB RAM VPS handles ~50K products at ~30ms retrieval. Expose retrieval endpoint for Reasoning Agent. Enables D5 utility scoring and eliminates per-query Serper costs once live. |

### Week 2 — Reasoning + Integration

| # | Task | Owner | Notes |
|---|---|---|---|
| K1 | Data Agent: structured query intake contract | [K] | Accept typed query object from Reasoning Agent. Schema in CLAUDE.md. Agree with Daniel before building. |
| K2 | Retailer scraping layer | [K] | Adapt existing scraping agent. Start with Amazon + Target + 1 category retailer. |
| K3 | Product page fetch + structured extraction | [K] | Per product: price, in_stock, title, specs, image_url, url (must be direct retailer URL), retailer_sku |
| K4 | Review signal extraction | [K] | `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`. Fallback: avg_rating + review_count only if review scraping blocked. |
| K5 | Enriched result object construction | [K] | Combine K3+K4 into typed JSON per product per CLAUDE.md schema. `url` field must be direct retailer URL. Must be stable — Daniel builds D5/D6 against it. |
| K6 | Sparse result flag | [K] | Flag which hard constraint failed when <3 results returned. Triggers D7. |
| K7 | Serper silent fallback | [K] | Fires when catalog returns 0 or errors. When falling back to Serper, flag affiliate linking as degraded for that result. |
| ~~D5~~ | ~~Personalized utility scoring~~ | ~~[D]~~ | **✅ Complete 2026-04-12 (D5-interim).** See Completed. |
| D7 | Constraint relaxation logic | [D] | When K6 sparse flag received: relax least-important constraint, re-query, tell user what changed. |
| D8 | Confident single recommendation mode | [D] | When top utility score significantly outscores others, Pine commits to one. User can ask for alternatives. |
| — | Integration test: full voice → intent → catalog → scoring → explanation → display | [D]/[K]/[E] | End-to-end demo rehearsal. Verify affiliate URLs resolve correctly from Kevin's catalog. |

### PM / Product (Parallel)

| # | Task | Owner | Notes |
|---|---|---|---|
| U-01 | Define user personas (at least 2) | [D]/[E] | Who is actually using Shop Mode? |
| U-02 | Draft PRD | [D] | After team alignment on Shop/Plan vision |
| U-04 | Error states: no results, API failure | [D] | UX requirement before demo |
| U-05 | Basic session persistence | [D] | Don't lose conversation on refresh |

---

## ⚪ Backlog — Phase 3 (Plan Mode — do not start until Level 4 complete)

### LLM & Intent
| # | Task | Owner | Notes |
|---|---|---|---|
| L-02 | Multi-turn prompt chain for Plan Mode | [D] | Plan |
| P2 | Bundle intent extraction | [D] | Multi-item scenario → structured bundle intent |
| P3 | Bundle coherence scoring | [D] | Score assembled bundle as a whole, not just individual items |

### Search & Product Pipeline
| # | Task | Owner | Notes |
|---|---|---|---|
| S-01 | Category and mustHaves filter post-search | [D] | Shop — price/brand done; `hard_constraints.must_have_attributes` now extracted by LLM but not yet used for post-search filtering |
| S-04 | End-to-end mock mode test for D1/D2 | [D] | Validate all acceptance criteria with `MOCK_INTENT=true` and `MOCK_CLARIFY=true`. |
| D10-full | Replace `resolveTop3Urls()` with catalog direct URLs | [D] | Once K-catalog-1 is live, Kevin's enriched result objects include direct retailer URLs as a first-class field — eliminating the second Serper API call entirely. Remove `resolveTop3Urls()` at that point. |
| D5-full | Replace `scoreProduct()` with full utility scoring against K5 enriched result objects | [D] | Specs, review_signals, structured attributes — replaces Serper-field proxy scoring. Blocked on K-catalog-1 + K5. |
| S-02 | Result deduplication | [D] | Shop |
| S-03 | Multi-item fetch for Plan Mode bundles | [D] | Plan |

### Chat UI & UX
| # | Task | Owner | Notes |
|---|---|---|---|
| C-01 | Shop / Plan mode toggle | [E] | Both |
| C-02 | Plan summary card component | [E] | Plan |
| C-03 | Product card — "Add to Plan" button | [E] | Plan |
| I4 | Right detail panel full implementation | [E] | Currently minimal |

### Infrastructure & Backend (Phase 4)
| # | Task | Owner | Notes |
|---|---|---|---|
| K-db-01 | User database schema design | [K] | Phase 4 — separate from catalog index (Phase 2) |
| K-db-02 | User session API | [K] | Phase 4 |
| K-db-03 | Saved plans storage | [K] | Phase 4 |
| K-db-04 | Reddit enrichment pipeline | [K] | Phase 4 — batch scrape r/BuyItForLife, r/frugalmalefashion, 3–5 category subs. Extract product recommendation signals, store as `review_signals` in catalog. Not real-time. |
| I1 | Replace localStorage auth with Kevin's backend | [K] | Phase 4 — btoa not production-safe |

### Product & Growth
| # | Task | Owner | Notes |
|---|---|---|---|
| P-01 | Analytics events instrumentation | [D]/[K] | Both |
| P-02 | Onboarding flow | [D]/[E] | Both |
| P-03 | User testing — 3 participants minimum | [D]/[E] | Both |

---

## ✅ Completed

| # | Task | Completed |
|---|---|---|
| ✓ | D5-interim: Lightweight product utility scoring + ranking in `route.ts` — `scoreProduct()` scores against budget ceiling/floor (-100 hard violation), `must_have_attributes` title match (+20 each), `vibe_keywords` (+8 each), `quality_priority`-weighted rating, review volume trust signals, and query origin rank. `scoreAndRankProducts()` stable-sorts all products before price/attribute filter pass. `callSerpAPIBatch()` extended to return `queryOrigins` map. `[D5-interim scores]` log visible in server console. Direct URL resolution remains disabled — all products return Google Shopping URLs. Replace with D5-full against Kevin's K5 enriched objects in Phase 2. | 2026-04-12 |
| ✓ | D10-partial: Top-3 direct URL resolution via Serper product detail call — `resolveTop3Urls()` added to `route.ts`. Fires 3 parallel Serper calls after filtering, using `product.product_id` + `product.name`. Walks `data.shopping ?? data.sellers` for a preferred-retailer URL (Amazon > Target > Walmart > Best Buy > Nordstrom > first). Updates `product.link` for top 3; products 4+ keep Google Shopping URL. Fails safe — original link preserved on any error. `product_id` field added to `Product` interface and threaded through `transformProducts()`. | 2026-04-11 |
| ✓ | D9: SerpAPI → Serper.dev migration — `callSerpAPI()` rewritten to POST `https://google.serper.dev/shopping` with `X-API-KEY` header. `mapSerperResult()` added to remap Serper field names (`imageUrl → thumbnail`, `link → product_link`, `ratingCount → reviews`, `productId → product_id`). `extracted_price` fallback parses from price string. `resolveRetailerUrls()` call replaced with `[AFFILIATE - D10]` comment block. `SERP_API_KEY` commented out in `.env.local`. `SERPER_API_KEY` guard added to POST handler. All other orchestration logic (batch, dedup, D6 parallel) unchanged. | 2026-04-10 |
| ✓ | LLM integration (OpenRouter + GPT-4o-mini) — API route intact | Phase 1 |
| ✓ | SerpAPI Google Shopping integration — API route intact | Phase 1 |
| ✓ | 35-feature backlog spreadsheet + PM structure | Setup |
| ✓ | Pass full conversation history to intent extraction | 2026-03-15 |
| ✓ | Structured intent schema — IntentResult TypeScript type | 2026-03-15 |
| ✓ | Rejected travel pivot — documented rationale | 2026-03-25 |
| ✓ | Affiliate monetization strategy finalized (Skimlinks + Amazon Associates) | 2026-03-25 |
| ✓ | Pine rebrand from Sicero — navy/gold, pinecone logo | 2026-03-25 |
| ✓ | Level 4 DME architecture defined — feature list and owner assignments | 2026-03-25 |
| ✓ | Daniel↔Kevin data contract schema defined in CLAUDE.md | 2026-03-25 |
| ✓ | B-01: OpenRouter API key resolved — live LLM calls working | 2026-03-26 |
| ✓ | D1: Structured intent extraction — IntentExtractionResult type + LLM prompt refactor | 2026-03-26 |
| ✓ | D2: Intent confidence scoring (0.0–1.0) + clarification gate | 2026-03-26 |
| ✓ | Kevin luxury UI redesign — orb, inputbar, hero, header, curated stubs in JSX | 2026-03-29 |
| ✓ | B-04: `/conversation` page created, wired to `/api/search` with full history passing | 2026-03-29 |
| ✓ | Bug: user message duplicated in every LLM call — fixed by sending `priorHistory` to API | 2026-03-29 |
| ✓ | D3: Preference accumulator — `accumulatedIntent` state merges constraints across turns | 2026-03-30 |
| ✓ | D4: `user_expertise` field — novice/intermediate/expert, drives clarification tone | 2026-03-30 |
| ✓ | Confidence scoring overhaul — deterministic additive rubric, expertise-adjusted thresholds | 2026-04-05 |
| ✓ | B-03 / K8: Direct retailer URL resolution via `serpapi_immersive_product_api` (disabled at scale — cost-prohibitive) | 2026-04-05 |
| ✓ | Adjacent search queries — `related_search_queries` field, up to 3 parallel queries per turn | 2026-04-05 |
| ✓ | Orb STT switched from MediaRecorder + Python/ngrok to browser SpeechRecognition | 2026-04-05 |
| ✓ | Discover page restored — 4 curated sections, skeleton loading, "Talk to Pine →" CTA | 2026-04-05 |
| ✓ | B-06: SerpAPI key invalid — resolved, new key confirmed working | 2026-04-07 |
| ✓ | E2: Orb halo speaking animation — rAF loop, lerp, asymmetric attack/release | 2026-04-08 |
| ✓ | Web Audio API wired to Inworld TTS for live volume feedback | 2026-04-08 |
| ✓ | Mic flash on conversation → home fix — stopVoice() cleanup on unmount | 2026-04-08 |
| ✓ | skipClarification flag — chip clicks and initial URL query bypass clarification gate | 2026-04-08 |
| ✓ | SerpAPI result count capped — MAX_RESULTS_PER_QUERY = 10 in route.ts | 2026-04-08 |
| ✓ | D6: Intent-match explanation generation — `generateExplanations()` wired to ProductCard | 2026-04-10 |
| ✓ | Placeholder cycling animation in hero.jsx — 8 phrases, 1500ms fade cycle | 2026-04-10 |
| ✓ | ldrs dotPulse loader in orb.jsx — replaces waveform bars during isProcessing | 2026-04-10 |
| ✓ | Flash fixes (4): pineResponse flash, idle copy reappearance, subtitle reappearance, "No results" on mount | 2026-04-10 |
| ✓ | pineHandoff extended to carry products array — eliminates conversation page mount API call | 2026-04-10 |
| ✓ | API economics modeled — Serper confirmed as SerpAPI replacement, DataForSEO assigned to batch role, own catalog confirmed as only architecture with fixed-cost retrieval | 2026-04-10 |

---

_To update: change status emoji and move row. Add date to Completed items._

