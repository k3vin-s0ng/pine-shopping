# Sicero — Active Task Board

_Updated each session. Owner tags: [D] = Daniel, [K] = Kevin, [E] = Eric_

---

## 🔴 Blocked / Needs Resolution

| # | Task | Owner | Notes |
|---|---|---|---|
| B-01 | OpenRouter API key invalid | [K] | Code is correct; Kevin's API key returns 401. Not a code bug — awaiting valid key from Kevin before LLM-driven intent extraction and clarifying questions can be tested end-to-end |

---

## 🟡 In Progress

| # | Task | Owner | Notes |
|---|---|---|---|
| I-02 | Competitive research (Google Shopping AI, Perplexity Shopping, etc.) | [D]/[E] | Needed before PRD |

---

## 🟢 Up Next (Prioritized)

| # | Task | Owner | Notes |
|---|---|---|---|
| U-01 | Define user personas (at least 2) | [D]/[E] | PM task — who is actually using Shop Mode? |
| U-02 | Draft Product Requirements Document (PRD) | [D] | After team alignment on Shop/Plan vision |
| U-03 | Clarification modal — trigger logic | [D] | Backend path implemented: shouldSearch=false returns LLM question without searching. Needs working API key (B-01) to test end-to-end. |
| U-04 | Error states: no results, API failure | [D] | UX requirement before MVP is shippable |
| U-05 | Basic session persistence | [D] | Don't lose conversation on refresh |

---

## ⚪ Backlog (Not Yet Scheduled)

### LLM & Intent Engine
| # | Task | Owner | Mode |
|---|---|---|---|
| L-02 | Multi-turn prompt chain for Plan Mode | [D] | Plan |
| L-03 | Confidence scoring on extracted intent | [D] | Shop |

### Search & Product Pipeline
| # | Task | Owner | Mode |
|---|---|---|---|
| S-01 | Category and mustHaves filter post-search | [D] | Shop | Price and brand filters are done; category/mustHaves are passed to the search query string but not post-filtered |
| S-02 | Result deduplication | [D] | Shop |
| S-03 | Multi-item fetch for Plan Mode bundles | [D] | Plan |

### Chat UI & UX
| # | Task | Owner | Mode |
|---|---|---|---|
| C-01 | Shop / Plan mode toggle | [D] | Both |
| C-02 | Plan summary card component | [D] | Plan |
| C-03 | Product card — "Add to Plan" button | [D] | Plan |
| C-05 | Deduplicate generalheader.tsx vs header.tsx | [D] | Both | Two nearly identical navbar components exist — consolidate |

### Infrastructure & Backend
| # | Task | Owner | Mode |
|---|---|---|---|
| K-01 | Database schema design | [K] | Both |
| K-02 | User session API | [K] | Both |
| K-03 | Saved plans storage | [K] | Plan |

### Product & Growth
| # | Task | Owner | Mode |
|---|---|---|---|
| P-01 | Analytics events instrumentation | [D]/[K] | Both |
| P-02 | Onboarding flow | [D]/[E] | Both |
| P-03 | User testing — 3 participants minimum | [D]/[E] | Both |

---

## ✅ Completed

| # | Task | Completed |
|---|---|---|
| ✓ | LLM integration (OpenRouter + GPT-4o-mini) | Phase 1 |
| ✓ | SerpAPI Google Shopping integration | Phase 1 |
| ✓ | React UI: agent avatars, speech bubbles, product cards | Phase 1 |
| ✓ | Clarification modal component | Phase 1 |
| ✓ | 35-feature backlog spreadsheet + PM structure | Setup |
| ✓ | Pass full conversation history to intent extraction (B-02 / I-01) | 2026-03-15 |
| ✓ | Structured intent schema — IntentResult TypeScript type (L-01) | 2026-03-15 |
| ✓ | Typing indicator and loading state — isTyping / isSearching (C-04) | 2026-03-15 |
| ✓ | Price filter layer — min/max on SerpAPI results and client-side (partial S-01) | 2026-03-15 |
| ✓ | Price filter direction — "over $X" vs "under $X" without false-positives on model numbers | 2026-03-15 |
| ✓ | Original products ref — subsequent price filters re-apply to original results, not prior filtered set | 2026-03-15 |
| ✓ | Voice input modal — hold-to-speak, transcript display, Done button submits (not mouse-up) | 2026-03-15 |
| ✓ | Auth system — sign in / sign up modal with localStorage persistence | 2026-03-15 |
| ✓ | Marketing landing page — hero, features, how-it-works, testimonials, footer | 2026-03-15 |
| ✓ | Removed non-functional Buy Now / Details buttons from product cards | 2026-03-15 |

---

_To update: change status emoji and move row to appropriate section. Add date to Completed items._
