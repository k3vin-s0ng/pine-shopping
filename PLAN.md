# Pine — Product Roadmap

_Last updated: 2026-04-08 (Orb halo speaking animation, Web Audio API volume sync, mic flash fix, chip skipClarification, SerpAPI result cap, fallback message copy)_

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

## Phase 2 — Level 4 Reasoning Agent (Current Sprint)

**Exit criteria:** Pine extracts structured intent, scores confidence, asks smart clarifying questions when needed, scores results against a preference vector, and explains why each recommendation matches.

### Daniel — Reasoning Agent
- [x] D1: Structured intent extraction → `{ hard_constraints, soft_preferences, confidence_score, clarification_needed }`
- [x] D2: Intent confidence scoring (0.0–1.0 threshold gates clarification vs. search)
- [x] D3: Multi-turn clarification loop — preference accumulator (`accumulatedIntent`) merges constraints across turns; ACCUMULATION RULE + refinement-turn confidence floor added to prompt
- [x] D4: Dialog adaptation by user expertise level — `user_expertise` field + USER EXPERTISE CLASSIFICATION section in prompt; clarification question style adapts per level
- [ ] D5: Personalized utility scoring against soft preference vector
- [x] D6: Intent-match explanation generation per top 3 results
- [ ] D7: Constraint relaxation logic when Data Agent returns sparse results
- [ ] D8: Confident single recommendation mode (when top result significantly outscores others)

### Kevin — Data Agent
- [ ] K1: Structured query intake contract (agree schema with Daniel — Week 1 Day 1-2)
- [ ] K2: Retailer scraping layer (Amazon + Target + 1 category-specific retailer)
- [ ] K3: Product page fetch + structured data extraction (price, stock, specs, image, URL)
- [ ] K4: Review signal extraction → `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`
- [ ] K5: Enriched result object construction (combines K3+K4 into typed JSON per product)
- [ ] K6: Sparse result flag when <3 viable products satisfy hard constraints
- [x] K8: Direct retailer URL resolution — `resolveRetailerUrls()` via `serpapi_immersive_product_api` endpoint, seller priority picker, `affiliate_degraded` flag. Affiliate linking confirmed working.
- [x] Adjacent search queries — `related_search_queries` field in intent schema + prompt, `buildSearchQueries()` + `callSerpAPIBatch()` in route, up to 3 parallel queries per turn.
- [ ] K1: Structured query intake contract (agree schema with Daniel — Week 1 Day 1-2)
- [ ] K2: Retailer scraping layer (Amazon + Target + 1 category-specific retailer)
- [ ] K3: Product page fetch + structured data extraction (price, stock, specs, image, URL)
- [ ] K4: Review signal extraction → `{ quality_signal, fit_signal, value_signal, avg_rating, review_count }`
- [ ] K5: Enriched result object construction (combines K3+K4 into typed JSON per product)
- [ ] K6: Sparse result flag when <3 viable products satisfy hard constraints
- [ ] K7: SerpAPI silent fallback when scraping returns zero results or fails

### Eric — Voice + UI
- [x] E1: Voice input — `orb.jsx` now uses browser `SpeechRecognition` API (no ngrok dependency). Original MediaRecorder/Python pipeline preserved in commented blocks for future Data Agent integration. Auto-routing complete: successful voice search stores results in localStorage (`orbData`) and navigates to `/conversation`; zero-result turns loop back to listening on landing.
- [x] E2: Orb UI state machine — idle / listening / processing / speaking all implemented. `talking` state drives a `requestAnimationFrame` halo pulsation loop in `orb.jsx`; halo scale, opacity, background alpha, and glow radius lerp against live audio RMS from Web Audio API (or a 3-frequency sine fallback when RMS is zero). `orb-wrap` gets `speaking` CSS class during TTS playback.
- [x] E3: Voice output via Inworld TTS — `speakWithInworld` in `inworldTTS.ts` proxied through `/api/tts`. `INWORLD_TTS_API_KEY` env var fixed (was `NEXT_PUBLIC_INWORLD_API_KEY`). Falls back to Web Speech Synthesis on failure. `onStart` callback added to `speakWithInworld` — fires when `audio.play()` resolves (audio actually starts).
- [x] E4: Result cards with intent-match explanation display (3 cards max, retailer logo link) — `ProductCard.jsx` + `ProductGrid.jsx` live in `/conversation`; D6 explanation slot stubbed with TODO
- [x] E5: Typing fallback input (visually subordinate, functionally equal to voice) — `inputbar.jsx` navigates to `/conversation`, `BottomBar.jsx` submits follow-ups to API

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
| 2026-03-29 | Kevin replaced all TSX components with new luxury JSX UI | New design direction: Playfair Display/Cormorant Garamond fonts, orb-centric layout, premium aesthetic. All conversational UI deleted. New stubs need to be wired to LLM pipeline. TypeScript dropped for JSX in component layer. Market page removed. |
| 2026-03-29 | Conversation page (`/conversation`) built and wired to `/api/search` | `LeftPanel`, `ProductCard`, `ProductGrid`, `BottomBar` all live. History passes correctly on every turn. `inputbar.jsx` navigates to conversation on submit. Two bugs found and fixed this session: clarification bubble mis-trigger and user-message duplication in LLM context. |
| 2026-03-29 | History duplication root cause identified | `newHistory` (containing current message) was sent to API; `extractIntent` then appended the same message again. Fixed by sending `priorHistory` to API. Impact: every prior LLM call had the current user message doubled, degrading multi-turn constraint accumulation. |
| 2026-03-30 | D3 preference accumulator made explicit via mergeIntent | Previously constraints carried forward by accident via history re-reading — unreliable if LLM missed a detail. Now `accumulatedIntent` state explicitly unions `hard_constraints` and `soft_preferences` across turns. `mergeIntent()` exported from server module as canonical reference; client-side logic in `page.jsx` mirrors it. |
| 2026-03-30 | D4 expertise classification added | `user_expertise` ("novice" / "intermediate" / "expert") derived from vocabulary, not confidence score. Drives clarification question tone: lifestyle-framed for novice, balanced for intermediate, spec-framed for expert. Never ask vibe questions to expert users. |
| 2026-03-30 | Landing page UI and logo updated | `hero.jsx`, `inputbar.jsx`, `curated.jsx`, `globals.css` updated to match Eric's HTML. Logo replaced; old logo archived. |
| 2026-03-31 | Kevin chose MediaRecorder + Python transcription backend over Web Speech Recognition API for voice input | Provides direct control over VAD (RMS-based silence detection), audio chunking, and format handling. Python FastAPI backend (`main.py`) exposed via ngrok serves `/transcribe`, `/upload-chunk`, `/finalize`. Trade-off: requires backend to be running and publicly accessible (ngrok); Web Speech API would be zero-infra. Decision stands for demo; revisit for production. |
| 2026-03-31 | `useConvo.ts` hook created as voice-side conversation manager | Manages voice history separately from the text conversation page. Calls `searchProducts` directly and speaks reply via TTS. Currently parallel to `/conversation` page — the two paths are not unified yet. Unification is a pending architecture decision. |
| 2026-04-02 | Voice-to-conversation auto-routing via localStorage handoff | When orb search returns products, `page.tsx` writes `orbData` to localStorage and calls `router.push("/conversation")`. Conversation page reads and clears `orbData` on mount, pre-populating the product grid without a duplicate API call. Zero-result turns stay on landing and re-enter listening. Trade-off: localStorage as cross-route data bus is a temporary pattern — should be replaced with proper state management (React context or URL params) before Phase 3. |
| 2026-04-02 | VAD threshold tuning — silence detection tightened | SILENCE_THRESHOLD raised 0.015→0.025 (matches SPEECH_THRESHOLD at 0.025), SILENCE_DURATION_MS reduced 1200→500ms. Result: faster auto-stop after speech ends, less missed audio from background noise crossing old threshold. |
| 2026-03-31 | Intent pivot detection added to schema and prompt | `is_pivot: boolean` added to `IntentExtractionResult`. On pivot, both `accumulatedIntent` and conversation history reset to only the current turn. Prevents prior category attributes from contaminating unrelated searches. Pivot examples embedded in prompt so model can learn the pattern. |
| 2026-03-31 | Price filter fallback added to route | When budget/attribute filters eliminate all results, `route.ts` returns unfiltered products with an explanatory message rather than an empty grid. Zero-result SerpAPI responses now surface a user-visible message instead of a blank state. |
| 2026-04-05 | Affiliate URL resolution via `serpapi_immersive_product_api` | SerpAPI Shopping results include a pre-built URL for the immersive product endpoint. `resolveRetailerUrls()` calls it per-product in parallel (with api_key appended — not included by default), reads `product_results.stores`, picks best seller by priority order. `sellers_results.online_sellers` path (from google_product engine) was wrong — correct path is `product_results.stores` on google_immersive_product. Affiliate linking confirmed working. |
| 2026-04-05 | Adjacent search queries added to intent schema | `related_search_queries: string[]` (0–2 entries) added to `IntentExtractionResult` and prompt. Route builds up to 3 total queries (`search_query` + related), runs `callSerpAPIBatch()` in parallel, merges and deduplicates results. Improves recall when exact phrasing misses products. Related queries must be semantically adjacent — not broad category jumps. |
| 2026-04-05 | Orb STT switched from MediaRecorder + Python/ngrok to browser SpeechRecognition | Eliminates ngrok dependency for local dev and demo reliability. MediaRecorder/VAD/Python pipeline preserved in commented blocks in `orb.jsx` with `[KEVIN - Whisper pipeline]` markers for future Data Agent integration. Trade-off: browser STT varies by browser/OS; Whisper gives more control over audio format and VAD tuning. |
| 2026-04-07 | Pine home page response display synced to actual audio start | `speakWithInworld` `onStart` callback fires when `audio.play()` resolves — guarantees text animation starts when audio begins, not on an arbitrary delay. Fallback (Web Speech Synthesis) does not animate text. |
| 2026-04-07 | Session state fully resets on home page navigation | localStorage keys `pineHandoff` and `orbData` cleared on `page.tsx` mount. All React state resets on component unmount. No conversation context leaks across sessions. |
| 2026-04-08 | Orb halo animation driven by rAF loop + lerp, mirroring orb-ui architecture | CSS keyframe animations on near-transparent halos had no visible effect. Replaced with `requestAnimationFrame` loop that overrides `background`, `transform`, `opacity`, and `filter: brightness() saturate()` directly. Asymmetric lerp (attack 0.08, release 0.04) gives natural feel. Three-frequency sine sum (10Hz, 17Hz, 27Hz) simulates irregular speech cadence when no live audio is available. |
| 2026-04-08 | Web Audio API wired to Inworld TTS for live volume feedback | `speakWithInworld` now accepts an `onVolume(rms)` callback. `AudioContext` + `AnalyserNode` pipeline polls RMS via `getByteTimeDomainData` in a `requestAnimationFrame` loop. RMS fed into `liveVolumeRef` in `orb.jsx`; halo animation consumes it. Falls back to sine-wave simulation when RMS is zero (silence between words). |
| 2026-04-08 | skipClarification flag added to bypass LLM clarification gate | Chip clicks and initial URL query (from curated cards on landing) pass `skipClarification: true` in the fetch body. `route.ts` skips the `clarification_needed` gate when this flag is set. Prevents low-confidence scores on short phrases (e.g., "something for a weekend trip" ~10pts) from triggering an unwanted clarification question. |
| 2026-04-08 | SerpAPI result count capped post-fetch via slice | `google_shopping` engine ignores the `num` param and returns ~100 results per query. 3 parallel queries = up to ~300 items merged into the grid. Fixed by adding `MAX_RESULTS_PER_QUERY = 10` constant in `route.ts` and applying `results.slice(0, MAX_RESULTS_PER_QUERY)` in `callSerpAPI()` after fetch. |
| 2026-04-08 | Mic flash on conversation → home navigation fixed | `SpeechRecognition` instance in `orb.jsx` was not cleaned up on unmount, causing the browser mic indicator to flash on and off during route transition. Fixed by destructuring `stop: stopVoice` from `useVoiceRecorder` in `conversation/page.jsx` and adding `useEffect(() => () => stopVoice(), [])` cleanup. |
| 2026-04-08 | Input bar linger delay synced between home and conversation pages | `onListeningChange(false)` and `onInterimTranscript("")` are now both delayed 1000ms inside the same `setTimeout` in `orb.jsx`. Prevents `inputDisplayValue` from switching from `interimValue` to `text` before the interim is cleared, which was causing the user's transcribed text to disappear instantly on the home page. |
| 2026-04-08 | Fallback message copy simplified | Price-filter fallback message changed from "I couldn't find exact matches within your constraints, but here are the closest options I found." → "Here are the closest options I found." |
| 2026-04-05 | D6 scoped to SerpAPI-only explanation generation for demo | `generateExplanations` fires after `resolveRetailerUrls` with `raw_intent_summary` + product name + price only — no specs or review signals. Explanation quality will improve when Kevin's enriched result objects (review signals, specs) are available in Phase 4. D5 utility scoring deferred to Phase 4. Kevin's Data Agent deferred past Character Capital deadline. |

---

## Open Strategic Questions

- What is the primary user persona for Shop Mode? (still needs definition)
- Which 2-3 retailers should Kevin's scraping agent target first?
- At what point does Kevin's database become essential vs. nice-to-have?
- What is the Character Capital application deadline exactly and what artifacts do they need?
