# Pine — Product Roadmap

_Last updated: 2026-03-25_

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

## Phase 1 — MVP (Complete)

- [x] LLM integration via OpenRouter (GPT-4o-mini)
- [x] SerpAPI Google Shopping integration
- [x] React conversational UI (avatars, bubbles, product cards, voice modal, auth modal)
- [x] Conversation context passed correctly to intent extraction
- [x] Price-based follow-up refinement working end-to-end
- [x] Clarification path built (`shouldSearch: false` → chat message)
- [x] Error state handling with mock product fallback

---

## Phase 2 — Level 4 Reasoning Agent (Current Sprint)

**Exit criteria:** Pine extracts structured intent, scores confidence, asks smart clarifying questions when needed, scores results against a preference vector, and explains why each recommendation matches.

### Daniel — Reasoning Agent
- [ ] D1: Structured intent extraction → `{ hard_constraints, soft_preferences, confidence_score, clarification_needed }`
- [ ] D2: Intent confidence scoring (0.0–1.0 threshold gates clarification vs. search)
- [ ] D3: Multi-turn clarification loop (one question max per turn, double-duty principle)
- [ ] D4: Dialog adaptation by user expertise level (vibe vs. spec vocabulary)
- [ ] D5: Personalized utility scoring against soft preference vector
- [ ] D6: Intent-match explanation generation per top 3 results
- [ ] D7: Constraint relaxation logic when Data Agent returns sparse results
- [ ] D8: Confident single recommendation mode (when top result significantly outscores others)

### Kevin — Data Agent
- [ ] K1: Structured query intake contract (agree schema with Daniel — Week 1 Day 1-2)
- [ ] K2: Retailer scraping layer (Amazon + Target + 1 category-specific retailer)
- [ ] K3: Product page fetch + structured data extraction (price, stock, specs, image, URL)
- [ ] K4: Review signal extraction → `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`
- [ ] K5: Enriched result object construction (combines K3+K4 into typed JSON per product)
- [ ] K6: Sparse result flag when <3 viable products satisfy hard constraints
- [ ] K7: SerpAPI silent fallback when scraping returns zero results or fails

### Eric — Voice + UI
- [ ] E1: Voice input via Web Speech API (orb trigger, transcript → intent pipeline)
- [ ] E2: Orb UI state machine (idle / listening / processing / responding animations)
- [ ] E3: Voice output via Web Speech Synthesis API (Pine speaks clarifications + explanations)
- [ ] E4: Result cards with intent-match explanation display (3 cards max, retailer logo link)
- [ ] E5: Typing fallback input (visually subordinate, functionally equal to voice)

### Shared
- [ ] Daniel↔Kevin handoff contract locked (query object + enriched result object schemas)
- [ ] Integration test: full voice → intent → Data Agent → scoring → explanation → display

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

## Phase 4 — Backend + Personalization

- [ ] Kevin's database integration
- [ ] User session persistence across visits
- [ ] Preference signals from past searches inform future recommendations
- [ ] Replace localStorage auth with real auth (Kevin's backend)

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

---

## Open Strategic Questions

- What is the primary user persona for Shop Mode? (still needs definition)
- Which 2-3 retailers should Kevin's scraping agent target first?
- At what point does Kevin's database become essential vs. nice-to-have?
- What is the Character Capital application deadline exactly and what artifacts do they need?
