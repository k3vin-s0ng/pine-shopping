# Pine — Active Task Board

_Updated: 2026-04-21 (Catalog-first retrieval wired in route.ts — retrieveFromCatalog() + pgvector similarity search + SerpAPI fallback. Fashion intent fields added to IntentExtractionResult and prompt. PREFERRED_RETAILERS consolidated.) | Owner tags: [D] = Daniel, [K] = Kevin, [E] = Eric_

---

## 🔴 Blocked / Needs Resolution

| # | Task | Owner | Notes |
|---|---|---|---|
| B-05 | TypeScript dropped for JSX in component layer | [K]/[D] | All new components are `.jsx` with no type annotations. Breaks TypeScript-strict convention in CLAUDE.md. Decision needed: migrate new components to TSX or accept JSX for UI layer. |
| B-02 | Daniel↔Kevin Data Agent handoff contract | [D]/[K] | Schema defined in CLAUDE.md. Needs explicit agreement from Kevin before K2+ and D5+ can be built. Priority: next team meeting. |
| B-07 | Catalog sub-category + retailer scope not yet decided | [D] | **Fashion niche decided. Now decide which sub-categories and retailers to seed first.** Recommendation: retailers = Nordstrom + ASOS + Amazon; categories = women's dresses, men's casualwear, footwear, outerwear. Blocks D-catalog-3 and D-catalog-2. Timebox: 30 minutes with Kevin. |

---

## 🟡 In Progress

| # | Task | Owner | Notes |
|---|---|---|---|
| I-02 | Competitive research (Google Shopping AI, Perplexity Shopping, etc.) | [D]/[E] | Needed before PRD |
| K-voice | Whisper/ngrok STT pipeline restoration | [K] | MediaRecorder + Python transcription backend replaced by browser `SpeechRecognition` API in `orb.jsx`. Original MediaRecorder/ngrok code preserved in commented blocks. Decision on which to use long-term is open. |
| D-voice-gap | Voice path missing accumulatedIntent | [D] | `useConvo.ts` (voice path) does not pass `accumulatedIntent` to `/api/search`. Multi-turn constraint accumulation works correctly on `/conversation` (text path). Fix when voice and text paths are unified. Do not fix in isolation. |

---

## 🟢 Up Next (Prioritized)

### Immediate — This Week (Catalog Foundation — Daniel + Reddit Scope — Kevin)

| # | Task | Owner | Notes |
|---|---|---|---|
| B-07 | Decide fashion catalog sub-categories + retailers | [D] | **Fashion niche decided. Now scope: retailers = Nordstrom + ASOS + Amazon; categories = women's dresses, men's casualwear, footwear, outerwear.** Blocks D-catalog-3 and D-catalog-2. 30-minute decision with Kevin. |
| D-catalog-0 | DataForSEO validation gate | [D] | Sign up for DataForSEO ($1 trial). Run Pine's top 10 real queries through Products → Sellers → Ad URL. Measure: (1) direct URL coverage — target ≥85%, (2) field parity with SerpAPI response, (3) cost per query. Write `docs/dataforseo-validation.md` with go/no-go. **Blocks all remaining catalog work.** If coverage <85%, escalate — affiliate feed strategy changes. |
| D-catalog-1 | Postgres + pgvector on Supabase — provision and schema | [D] | Provision Supabase (Pro plan, $25/mo flat). Enable extensions: `pgvector`, `pg_trgm`, `ltree`. Run migrations (see CLAUDE.md for schema). Tables: `products`, `product_pricing`, `price_history`, `categories`. Indexes: HNSW on `embedding` (halfvec 1536), GIN on `tsvector`, GIN on `attributes JSONB`, composite on `(category_id, price_cents) WHERE availability='in_stock'`. Use HNSW — not IVFFlat. |
| D-catalog-4 | Redis cache layer (Upstash) | [D] | Provision Upstash Redis (free tier to start, ~$10/mo at scale). Implement cache-aside: key = normalized intent hash, 1h TTL on result sets, 6h on product metadata. Write-through on every SerpAPI live fallback hit. Sits in front of Postgres in the retrieval path. |
| K-reddit-1 | Subreddit scope + scraping pipeline | [K] | Fashion subreddits: r/femalefashionadvice, r/malefashionadvice, r/frugalmalefashion, r/streetwear, r/buyitforlife (quality signals for accessories + outerwear). Build batch scraper: top posts (all-time + past year) + comments → extract product mentions, brand names, sentiment. Scheduled weekly batch — never real-time. |

### Week 1 — Catalog Ingestion + Reddit Signal Extraction

| # | Task | Owner | Notes |
|---|---|---|---|
| D-catalog-3 | Scope: confirm fashion retailers + sub-categories | [D] | Locked once B-07 decided. Fashion only — apparel, footwear, accessories, outerwear. Recommended retailers: Nordstrom, ASOS, Amazon. Start narrow — 3–4 sub-categories max for initial seed. |
| D-catalog-2 | Batch catalog population via DataForSEO Merchant API | [D] | Build ingestion pipeline: seed query list (200–500 queries from top Pine sessions + category taxonomy) → POST to DataForSEO Standard queue ($1/1K) → poll for completion → Products endpoint parse → Sellers endpoint per `product_id` (direct retailer URLs) → Ad URL resolver for remaining `aclk` tokens → normalize + dedupe by `(gtin \|\| title_hash, merchant)` → embed via OpenAI `text-embedding-3-small` (~$0.50 one-time for 50K) → write to Postgres. **Run 5K products first (~$5 cost). Validate quality before scaling to 50K.** Total estimated cost: $15–50 one-time. DataForSEO is async — never wire this to the real-time query path. |
| K-reddit-2 | Structured signal extraction | [K] | Parse raw scraped text into structured `review_signals`: `{ product_name, brand, subreddit, sentiment, mention_count, community_label, post_url }`. LLM-assisted extraction acceptable; deterministic fallback on parse failure. |
| K-reddit-3 | Schema + storage in Supabase | [K] | `reddit_signals` table keyed by normalized product name + brand. Join to `products` table via fuzzy match on title. Signals feed into D5/D6 explanation generation as social proof layer (e.g. "highly recommended by r/BuyItForLife"). |
| K-reddit-4 | Signal freshness + re-scrape cadence | [K] | Weekly re-scrape for top subreddits, monthly for long-tail. Append-only inserts with `scraped_at` timestamp — do not overwrite prior signals. |

### Week 2 — Catalog Retrieval Integration

| # | Task | Owner | Notes |
|---|---|---|---|
| ~~D-catalog-retrieve~~ | ~~Catalog-first retrieval in Reasoning Agent~~ | ~~[D]~~ | **✅ Complete 2026-04-21** — `retrieveFromCatalog()`, `generateQueryEmbedding()`, `getSupabaseClient()` added to route.ts. POST handler attempts catalog first (similarity ≥ 0.72, min 3 results); falls through to SerpAPI on miss. `match_products` RPC SQL provided in session brief — run in Supabase SQL Editor before testing. |
| D-catalog-freshness | Freshness gate in retrieval | [D] | Filter out or async-enqueue refresh for any catalog result where `refreshed_at` > 7 days. Never surface a stale price to a user. |
| K1 | Data Agent: structured query intake contract | [K] | Accept typed query object from Reasoning Agent per CLAUDE.md schema. Agree with Daniel before building. |
| K2 | Retailer scraping layer | [K] | Adapt existing scraping agent. Start with scoped retailers from D-catalog-3. |
| K3 | Product page fetch + structured extraction | [K] | Per product: price, in_stock, title, specs, image_url, url (must be direct retailer URL), retailer_sku. |
| K4 | Review signal extraction | [K] | `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`. Fallback: avg_rating + review_count only if review scraping blocked. |
| K5 | Enriched result object construction | [K] | Combine K3+K4 into typed JSON per product per CLAUDE.md schema. `url` field must be a direct retailer URL. Must be stable — Daniel builds D5/D6 against it. |
| K6 | Sparse result flag | [K] | Flag which hard constraint failed when <3 results returned. Triggers D7. |
| K7 | SerpAPI silent fallback | [K] | Fires when catalog returns 0 or errors. Write-through to Redis on fallback hit. Flag `affiliate_degraded: true` if URL is not a direct retailer link. |
| D5-full | Replace D5-interim with full utility scoring against K5 enriched result objects | [D] | Specs, review_signals, structured attributes — replaces SerpAPI-field proxy scoring. Blocked on D-catalog-1 + K5. |
| D7 | Constraint relaxation logic | [D] | When K6 sparse flag received: relax least-important constraint, re-query, tell user what changed. |
| D8 | Confident single recommendation mode | [D] | When top utility score significantly outscores others, Pine commits to one. User can ask for alternatives. |

### Week 2 — Monitoring + Instrumentation

| # | Task | Owner | Notes |
|---|---|---|---|
| D-metrics | Hit rate instrumentation | [D] | Log: catalog hit rate, Redis hit rate, SerpAPI fallback rate, avg result age, latency per path. These are the numbers that prove the architecture works. Character Capital will want to see them. |
| D-refresh | Weekly catalog price refresh | [D] | Re-run catalog-ingest.js weekly via cron or manually. Upserts overwrite existing rows — no duplicates. Cost: ~$1–2/run at current seed query count. Replaces the JSON-LD scraper approach (unreliable across retailers, breaks silently on page structure changes). Add staleness filter to retrieveFromCatalog() before this runs: .gte('refreshed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()). Revisit JSON-LD scraper post-funding when catalog exceeds 500K products. |
| D10-full | Replace `resolveTop3Urls()` with catalog direct URLs | [D] | Once D-catalog-1 is live and catalog URLs are validated, remove `resolveTop3Urls()` and the SerpAPI immersive call entirely. Direct retailer URLs come from the catalog as a first-class field. |

### PM / Product (Parallel)

| # | Task | Owner | Notes |
|---|---|---|---|
| U-01 | Define user personas (at least 2) | [D]/[E] | Who is actually using Shop Mode? |
| U-02 | Draft PRD | [D] | After team alignment on Shop/Plan vision |
| U-04 | Error states: no results, API failure | [D] | UX requirement before demo |
| U-05 | Basic session persistence | [D] | Don't lose conversation on refresh |
| affiliate-apply | Apply to affiliate networks | [D] | Impact.com, CJ Affiliate, Awin, ShareASale, Rakuten Advertising. 3–6 month approval timeline — start now so feeds are available for Phase 4 enrichment. Free bulk product catalogs become a zero-cost catalog input once approved. |

### Integration + Integration Test

| # | Task | Owner | Notes |
|---|---|---|---|
| — | Integration test: full voice → intent → catalog → scoring → explanation → display | [D]/[K]/[E] | End-to-end demo rehearsal. Verify affiliate URLs resolve correctly from catalog. Verify catalog hit rate metrics. |

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
| K-db-04 | Reddit enrichment pipeline | [K] | _(Moved to Phase 2 as K-reddit-1 through K-reddit-4. See Up Next.)_ |
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
| ✓ | **K-catalog-research: Vector DB evaluation resolved** — pgvector on Supabase chosen over Qdrant. One DB, ACID price updates, ~75% cheaper than Pinecone, HNSW by default. Qdrant revisited only at 1M+ products. | 2026-04-18 |
| ✓ | **Catalog architecture decided** — DataForSEO batch (Products → Sellers → Ad URL) + pgvector on Supabase + Redis (Upstash) + SerpAPI live fallback. Direct retailer URLs resolved at ingest time. SerpAPI demoted to fallback for cache/catalog misses only. | 2026-04-18 |
| ✓ | D9-revert + D10-partial: Reverted to SerpAPI as primary search provider. `resolveTop3Urls()` reinstated using `serpapi_immersive_product_api` — 3 flat parallel SerpAPI immersive calls after D5 scoring, top 3 only. Products 4+ keep SerpAPI `product_link`. | 2026-04-15 |
| ✓ | D5-interim: Lightweight product utility scoring + ranking in `route.ts` — `scoreProduct()` scores against budget ceiling/floor (-100 hard violation), `must_have_attributes` title match (+20 each), `vibe_keywords` (+8 each), `quality_priority`-weighted rating, review volume trust signals, and query origin rank. `scoreAndRankProducts()` stable-sorts all products before price/attribute filter pass. | 2026-04-12 |
| ✓ | D10-partial: Top-3 direct URL resolution via Serper product detail call — `resolveTop3Urls()` added to `route.ts`. Fires 3 parallel calls after filtering. Updates `product.link` for top 3; products 4+ keep Google Shopping URL. | 2026-04-11 |
| ✓ | D9: SerpAPI → Serper.dev migration (subsequently reverted 2026-04-15) | 2026-04-10 |
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
| ✓ | API economics modeled — own catalog confirmed as only architecture with fixed-cost retrieval | 2026-04-10 |
| ✓ | **Fashion intent fields added to IntentExtractionResult + prompt** — `hard_constraints`: `size`, `gender_presentation`. `soft_preferences`: `fit_preference`, `color_palette`, `season`, `style_avoid`. FASHION CONTEXT section added to `intentExtractionPrompt.ts` with 6 worked examples. `mergeIntent()` updated to accumulate `color_palette` and `style_avoid` as sets. | 2026-04-21 |
| ✓ | **PREFERRED_RETAILERS consolidated** — Duplicate arrays (`PREFERRED_RETAILERS` + `RETAILER_PRIORITY`) merged into single constant at top of `route.ts`, updated to full fashion retailer list per CLAUDE.md. | 2026-04-21 |
| ✓ | **D-catalog-retrieve: Catalog-first retrieval wired in route.ts** — `getSupabaseClient()` (lazy init), `generateQueryEmbedding()` (OpenAI text-embedding-3-small via existing openai instance), `retrieveFromCatalog()` (pgvector similarity ≥ 0.72 + pricing join + hard constraint filters + min 3 results gate). POST handler: catalog path → SerpAPI else path. Filter/resolveTop3Urls/D6 pipeline unchanged. Run `match_products` RPC SQL in Supabase SQL Editor before testing. | 2026-04-21 |

---

_To update: change status emoji and move row. Add date to Completed items._