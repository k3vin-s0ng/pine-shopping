# Pine — Claude Code Session Briefing

> Read this file first, every session. Then read `PLAN.md` and `TODO.md` before writing any code.

---

## What Is Pine?

Pine is an AI-powered conversational shopping assistant. The core differentiator is **conversational intent translation** — users describe what they want naturally and Pine returns real, purchasable products. This is NOT a search engine with a chat wrapper. Context retention across turns is a first-class product requirement.

The platform has two modes:
- **Shop Mode** — single-item conversational product discovery
- **Plan Mode** — multi-item bundle planning for events, gifts, dorm rooms, outfits

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + React |
| LLM | OpenRouter → GPT-4o-mini |
| Product Search | SerpAPI (Google Shopping) — being replaced by Kevin's Data Agent |
| Database | Kevin — not yet integrated |
| Design | Figma |

---

## Team & Ownership

| Person | Domain |
|---|---|
| Daniel | LLM integration, Reasoning Agent, product management |
| Kevin | Backend infrastructure, Data Agent (scraping + retrieval) |
| Eric | Product vision, UI/UX design, voice interface |

Daniel is the PM. When making architecture decisions, flag tradeoffs clearly so Daniel can make the call.

---

## Architecture Overview (Current — Level 3.5)

```
User Message
    ↓
Intent Extraction (LLM) ← MUST receive full conversation history
    ↓
Search Query Builder
    ↓
SerpAPI (Google Shopping)
    ↓
Result Formatter
    ↓
Response + Product Cards rendered in React
```

## Architecture Target (Level 4 — In Progress)

```
User Voice/Text Input
    ↓
Reasoning Agent (Daniel)
    ├── Structured Intent Extraction → { hard_constraints, soft_preferences, confidence_score }
    ├── Confidence Check
    │     ├── Low (<0.5): Fire clarification question (double-duty: narrows + reweights)
    │     └── High (≥0.5): Proceed to Data Agent
    ↓
Data Agent (Kevin)
    ├── Multi-source retailer scraping
    ├── Product page fetch + spec extraction
    ├── Review signal extraction
    └── Returns enriched result objects[]
    ↓
Reasoning Agent (Daniel) — continued
    ├── Utility scoring against soft preference vector
    ├── Intent-match explanation generation (per top 3 results)
    └── Constraint relaxation if results sparse
    ↓
UI (Eric)
    └── Orb voice interface + Result cards with explanations
```

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
  };
  soft_preferences: {
    aesthetic?: string;
    occasion?: string;
    vibe_keywords?: string[];
    brand_sensitivity?: "low" | "medium" | "high";
    quality_priority?: "low" | "medium" | "high";
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
                         // Kevin owns URL resolution via SerpAPI Product Results, Amazon PA-API, or scraping
  image_url: string;
  retailer: string;
  retailer_sku: string;        // keep for future closed-ecosystem fulfillment
  specs: Record<string, string>;
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
The intent extraction system **must** receive the full conversation history on every turn. A message like "only show gaming ones" has zero meaning without prior context. **Root cause identified and fixed:** the intent extraction function was previously not being passed conversation history — it was operating stateless. Never strip or omit conversation history before the LLM call. This is a known past failure point.

---

## Key UI Components (already built)

- Agent avatar (`avatarsvg.tsx`) — animated SVG with idle / listening / speaking states
- Chat panel (`chatpanel.tsx`) — message history, auto-resize textarea, voice toggle, typing indicator, quick-action chips
- Voice input modal (`voicemodal.tsx`) — hold-to-speak, live transcript display, Done button submits
- Product cards (`market.tsx`) — image, name, price, rating, match %, direct buy link
- Results panel (`resultspanel.tsx`) — filter bar, product grid, empty state
- Right detail panel (`rightpanel.tsx`) — selected product full view (minimal)
- Auth modal (`authmodal.tsx`) — localStorage persistence (NOT production-safe)
- Marketing landing page (`sections.tsx`)
- Header / navbar (`header.tsx`, `generalheader.tsx`) — consolidation pending (C-05)

**Clarification flow:** The clarification modal exists but surfaces as a chat message via the `shouldSearch: false` path in the API route — not a popup. Wire `clarification_needed: true` from intent extraction into this existing path.

---

## Monetization (Current)
Affiliate-first via Skimlinks + Amazon Associates. Long-term vision is a closed ecosystem where payment completes on Pine and we source direct from retailer — requires retailer agreements, payment processing (Stripe), and backend infrastructure. **Do not build payment infrastructure now.** Retailer SKU field is included in the data contract to preserve the path.

---

## Coding Conventions

- TypeScript strictly — no `any` types without justification
- Keep LLM prompt logic in dedicated prompt files, not inline
- Conversation history must be passed as a typed array, not reconstructed from DOM
- When adding a feature, check `TODO.md` for the relevant backlog item and update its status
- Intent extraction output must be parsed with try/catch — fallback to flat query string on failure

---

## Auth System (Current State)
Auth via `auth.tsx` (React context + localStorage). Passwords encoded with `btoa()` — not secure, placeholder only. Replace with Kevin's backend before any real launch.

---

## Python Backend Services (Unintegrated)
- `conversation/main.py` — Whisper transcription spike. Superseded by browser Speech Recognition API.
- `evidence-finder/main.py` — FastAPI debate research service. Separate product. Do not touch.

---

## What NOT to Do

- Do not pivot product scope mid-session without flagging as a strategic decision
- Do not silently drop conversation history to simplify a function
- Do not add new dependencies without noting them here
- Do not implement Plan Mode features until Shop Mode Level 4 core is stable
- Do not use localStorage auth as a model for real auth
- Do not change the Daniel↔Kevin handoff contract schema without both agreeing
- Do not remove SerpAPI fallback until Kevin's scraping agent is demonstrably stable

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
