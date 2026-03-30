# Pine — Active Task Board

_Updated: 2026-03-29 (D3 + D4 implemented) | Owner tags: [D] = Daniel, [K] = Kevin, [E] = Eric_

---

## 🔴 Blocked / Needs Resolution

| # | Task | Owner | Notes |
|---|---|---|---|
| B-05 | TypeScript dropped for JSX in component layer | [K]/[D] | All new components are `.jsx` with no type annotations. This breaks the TypeScript-strict convention in CLAUDE.md and loses type safety on the conversation history, intent extraction output, and product card props. Decision needed: migrate new components to TSX or accept JSX for UI layer. |
| B-02 | Daniel↔Kevin Data Agent handoff contract | [D]/[K] | Schema defined in CLAUDE.md. Needs explicit agreement from Kevin before K2+ and D5+ can be built. Priority: next team meeting. |
| B-03 | Direct retailer URL resolution strategy | [K] | SerpAPI Google Shopping returns google.com/shopping URLs — not retailer URLs. Affiliate links (Skimlinks, Amazon Associates) require direct retailer URLs to generate commissions. Kevin must resolve this before affiliate monetization works. See K8 for resolution options. Daniel's Reasoning Agent is unaffected — it stays on SerpAPI for search; Kevin's Data Agent is responsible for returning valid `url` in enriched result objects. |

---

## 🟡 In Progress

| # | Task | Owner | Notes |
|---|---|---|---|
| I-02 | Competitive research (Google Shopping AI, Perplexity Shopping, etc.) | [D]/[E] | Needed before PRD |

---

## 🟢 Up Next (Prioritized)

### Week 1 — Critical Path

| # | Task | Owner | Notes |
|---|---|---|---|
| K1 | Data Agent: structured query intake contract | [K] | Accept typed query object from Reasoning Agent. Schema in CLAUDE.md. Agree with Daniel before building. |
| K8 | Direct retailer URL resolution | [K] | **Blocks affiliate monetization.** Kevin to choose and implement one of: (1) SerpAPI Product Results endpoint — takes Google Shopping product ID, returns merchant seller links with direct retailer URLs; extra call per product but keeps SerpAPI as fallback. (2) Amazon Product Advertising API — returns direct Amazon URLs natively, designed for Associates program. (3) Direct scraping — Kevin's Data Agent scrapes retailer pages directly, URL is the page URL. All three valid; Kevin decides based on reliability and rate limits. Enriched result object `url` field MUST be a direct retailer URL — never a google.com/shopping URL. |
| K2 | Retailer scraping layer | [K] | Adapt existing scraping agent. Start with Amazon + Target + 1 category retailer. Narrow and reliable beats broad and flaky. |
| E1 | Voice input via Web Speech API | [E] | Orb tap → listening → transcript feeds D1 pipeline. `orb.jsx` exists but has no Speech API. Chrome desktop reliable for demo. |
| E2 | Orb UI state machine | [E] | 4 states: idle / listening / processing / responding. `orb.jsx` currently has idle/listening only. Add processing + responding states. |

### Week 2 — Reasoning + Integration

| # | Task | Owner | Notes |
|---|---|---|---|
| K3 | Product page fetch + structured extraction | [K] | Per product: price, in_stock, title, specs, image_url, url (must be direct retailer URL — see K8), retailer_sku |
| K4 | Review signal extraction | [K] | `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`. Fallback: avg_rating + review_count only if review scraping blocked. |
| K5 | Enriched result object construction | [K] | Combine K3+K4 into typed JSON per product per CLAUDE.md schema. `url` field must be direct retailer URL (see K8). Must be stable — Daniel builds D5/D6 against it. |
| K6 | Sparse result flag | [K] | Flag which hard constraint failed when <3 results returned. Triggers D7. |
| K7 | SerpAPI silent fallback | [K] | Fires when scraping returns 0 or errors. When falling back to SerpAPI, Kevin must still resolve to direct retailer URLs (see K8) or flag affiliate linking as degraded for that result. |
| D4 | Dialog adaptation by expertise level | [D] | Classify user vocab on first message (vibe vs. spec). Low-effort after D1-D3. |
| D5 | Personalized utility scoring | [D] | Score Kevin's enriched results against soft preference vector. Replaces default SerpAPI ordering. Requires K5 stable. |
| D6 | Intent-match explanation generation | [D] | One sentence per top 3 results using Kevin's review_signals + expressed intent. Highest-visibility Level 4 feature. |
| D7 | Constraint relaxation logic | [D] | When K6 sparse flag received: relax least-important constraint, re-query, tell user what changed. |
| D8 | Confident single recommendation mode | [D] | When top utility score significantly outscores others, Pine commits to one. User can ask for alternatives. |
| E3 | Voice output via Web Speech Synthesis | [E] | Pine speaks clarifications + explanations. Browser-native. Completes voice loop. |
| E4 | Result cards with explanation display | [E] | 3 cards max. Image, price, "View at [Retailer]" link with retailer logo, one-sentence D6 explanation. No generic "Buy Now." Link must use direct retailer URL from Kevin's enriched result object for affiliate tracking to work. |
| E5 | Typing fallback input | [E] | Always present, visually subordinate to orb. Full pipeline parity with voice. |
| — | Integration test: full voice → intent → Data Agent → scoring → explanation → display | [D]/[K]/[E] | End-to-end demo rehearsal. Must pass before Character Capital. Verify affiliate URLs resolve correctly. |

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
| S-04 | End-to-end mock mode test for D1/D2 | [D] | Validate all acceptance criteria with `MOCK_INTENT=true` and `MOCK_CLARIFY=true`. Blocked until B-01 (API key) resolved for live testing. |
| S-02 | Result deduplication | [D] | Shop |
| S-03 | Multi-item fetch for Plan Mode bundles | [D] | Plan |

### Chat UI & UX
| # | Task | Owner | Notes |
|---|---|---|---|
| C-01 | Shop / Plan mode toggle | [E] | Both |
| C-02 | Plan summary card component | [E] | Plan |
| C-03 | Product card — "Add to Plan" button | [E] | Plan |
| C-05 | ~~Deduplicate generalheader.tsx vs header.tsx~~ | — | Resolved — both deleted in Kevin's UI overhaul. `header.jsx` is the only header now. |
| I4 | Right detail panel full implementation | [E] | Currently minimal |

### Infrastructure & Backend
| # | Task | Owner | Notes |
|---|---|---|---|
| K-01 | Database schema design | [K] | Phase 4 |
| K-02 | User session API | [K] | Phase 4 |
| K-03 | Saved plans storage | [K] | Phase 4 |
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
| ✓ | LLM integration (OpenRouter + GPT-4o-mini) — API route intact | Phase 1 |
| ✓ | SerpAPI Google Shopping integration — API route intact | Phase 1 |
| ✓ | React UI: agent avatars, speech bubbles, product cards | Phase 1 — **⚠️ deleted in Kevin's UI overhaul 2026-03-29** |
| ✓ | Clarification modal component | Phase 1 — **⚠️ deleted in Kevin's UI overhaul 2026-03-29** |
| ✓ | 35-feature backlog spreadsheet + PM structure | Setup |
| ✓ | Pass full conversation history to intent extraction (B-02 / I-01) — logic intact in API route | 2026-03-15 |
| ✓ | Structured intent schema — IntentResult TypeScript type (L-01) — intact in API route | 2026-03-15 |
| ✓ | Typing indicator and loading state — isTyping / isSearching (C-04) | 2026-03-15 — **⚠️ deleted** |
| ✓ | Price filter layer — min/max on SerpAPI results and client-side (partial S-01) | 2026-03-15 — **⚠️ client-side deleted** |
| ✓ | Price filter direction — "over $X" vs "under $X" without false-positives on model numbers | 2026-03-15 — **⚠️ deleted** |
| ✓ | Original products ref — subsequent filters re-apply to original results, not prior filtered set | 2026-03-15 — **⚠️ deleted** |
| ✓ | Voice input modal — hold-to-speak, transcript display, Done button submits | 2026-03-15 — **⚠️ deleted** |
| ✓ | Auth system — sign in / sign up modal with localStorage persistence | 2026-03-15 — **⚠️ deleted** |
| ✓ | Marketing landing page — hero, features, how-it-works, testimonials, footer | 2026-03-15 — **⚠️ deleted** |
| ✓ | Removed non-functional Buy Now / Details buttons from product cards | 2026-03-15 — **⚠️ product cards deleted** |
| ✓ | Rejected travel pivot — documented rationale | 2026-03-25 |
| ✓ | Affiliate monetization strategy finalized (Skimlinks + Amazon Associates) | 2026-03-25 |
| ✓ | Pine rebrand from Sicero — navy/gold, pinecone logo | 2026-03-25 |
| ✓ | Level 4 DME architecture defined — feature list and owner assignments | 2026-03-25 |
| ✓ | Daniel↔Kevin data contract schema defined in CLAUDE.md | 2026-03-25 |
| ✓ | B-01: OpenRouter API key resolved — live LLM calls working | 2026-03-26 |
| ✓ | D1: Structured intent extraction — IntentExtractionResult type + LLM prompt refactor | 2026-03-26 |
| ✓ | D2: Intent confidence scoring (0.0–1.0) + clarification gate wired into shouldSearch path | 2026-03-26 |
| ✓ | Kevin luxury UI redesign — new orb, inputbar, hero, header, curated stubs in JSX | 2026-03-29 |
| ✓ | B-04: `/conversation` page created, wired to `/api/search` with full history passing | 2026-03-29 |
| ✓ | E-06: `inputbar.jsx` navigates to `/conversation?q=…` on submit (Enter or send button) | 2026-03-29 |
| ✓ | E-07: `ProductCard.jsx` + `ProductGrid.jsx` built in luxury design system | 2026-03-29 |
| ✓ | E-08: `LeftPanel.jsx` echoes query + status; `ProductGrid` renders clarification when no products | 2026-03-29 |
| ✓ | Bug: clarification bubble shown on empty-product searches — fixed with explicit `clarificationNeeded` flag from API | 2026-03-29 |
| ✓ | Bug: current user message duplicated in every LLM call — fixed by sending `priorHistory` (not `newHistory`) to API | 2026-03-29 |
| ✓ | Refine chips now submit directly to AI on click (no manual Enter required) | 2026-03-29 |
| ✓ | D3: Preference accumulator implemented — `accumulatedIntent` state merges `hard_constraints` and `soft_preferences` forward across turns without dropping prior constraints. `mergeIntent()` exported from `intentExtraction.ts` (server-side reference). Client-side merge duplicated in `page.jsx`. `accumulatedIntent` sent to API on every call; clears on Restart. | 2026-03-30 |
| ✓ | D3: ACCUMULATION RULE added to prompt — model instructed to carry all prior constraints forward in each turn's output. Refinement-turn confidence floor (≥0.7 when category + ≥1 constraint established) added. B-06 and B-07 resolved. | 2026-03-30 |
| ✓ | D4: `user_expertise` field added to `IntentExtractionResult` — "novice" / "intermediate" / "expert" derived from vocabulary. USER EXPERTISE CLASSIFICATION section added to prompt with per-level clarification question style rules. | 2026-03-30 |
| ✓ | API route now returns `intent` object on all response paths (clarification, search, SerpAPI error) — consumed by client-side accumulator. Accepts `accumulatedIntent` from frontend for D5 utility scoring (logged for now). | 2026-03-30 |

---

_To update: change status emoji and move row. Add date to Completed items._

