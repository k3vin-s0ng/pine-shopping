# Sicero — Product Roadmap

_Last updated: 2026-03-15_

---

## Current Phase: MVP Completion

The goal of the MVP is a working end-to-end Shop Mode experience: user sends a message → intent is extracted → products are fetched → results appear in a conversational UI with context retained across turns.

---

## Phase 1 — MVP (Current)

**Exit criteria:** A user can have a 3-turn shopping conversation where each follow-up correctly refines the prior search.

### Must-Haves
- [x] LLM integration via OpenRouter (GPT-4o-mini)
- [x] SerpAPI Google Shopping integration
- [x] React conversational UI (avatars, bubbles, product cards, voice modal, auth modal)
- [x] **Conversation context passed correctly to intent extraction**
- [x] Price-based follow-up refinement (over/under $X) working end-to-end client-side
- [ ] LLM-driven semantic follow-up refinement ("only gaming ones") — blocked on valid API key (B-01)
- [ ] Clarification modal triggering on ambiguous queries — backend path built (shouldSearch=false), blocked on valid API key (B-01)

### Nice-to-Haves (Phase 1)
- [ ] Basic session persistence (don't lose chat on refresh)
- [x] Error state handling (API failure) — fallback to mock product DB on catch

---

## Phase 2 — Plan Mode Alpha

Only begin after Phase 1 exit criteria are met.

**Goal:** Users can describe a scenario ("I'm throwing a birthday party for 10 people, budget $200") and get a curated multi-item bundle with reasoning.

### Features
- [ ] Plan Mode toggle in UI
- [ ] Gift bundle planning prompt chain
- [ ] Multi-item cart / plan view
- [ ] Plan summary card component

---

## Phase 3 — Personalization + Backend

**Goal:** Users have persistent profiles. Preferences learned over time influence results.

- [ ] Kevin's database integration
- [ ] User session storage
- [ ] Preference signals from past searches
- [ ] A/B test Shop vs Plan usage rates

---

## Phase 4 — Growth & Distribution

- [ ] User personas validated with real users
- [ ] Onboarding flow
- [ ] Referral / sharing of Plans
- [ ] Analytics instrumentation

---

## Strategic Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03 | Dual-mode (Shop + Plan) instead of full pivot to catering/events | Preserves MVP scope while accommodating Eric's vision |
| 2026-03 | OpenRouter + GPT-4o-mini over self-hosted model | Speed and cost for MVP stage |
| 2026-03-15 | Client-side price refinement short-circuit (no re-search for over/under $X) | Reduces API calls and latency for simple price filter follow-ups |
| 2026-03-15 | Browser Speech Recognition API for voice input (no server-side AST) | Zero infra cost, works natively in Chrome/Edge; Safari support limited |
| 2026-03-15 | Auth stored in localStorage (btoa encoding) | Sufficient for MVP demo; NOT production-safe — must replace with Kevin's backend before launch |

_Add rows here whenever a significant product or architecture decision is made._

---

## Open Strategic Questions

- What is the primary user persona for Shop Mode? (needs definition)
- How does Sicero differentiate from Google Shopping's own AI features?
- At what point does Kevin's backend become essential vs. a nice-to-have?
