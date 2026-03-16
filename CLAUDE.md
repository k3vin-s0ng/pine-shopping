# Sicero — Claude Code Session Briefing

> Read this file first, every session. Then read `PLAN.md` and `TODO.md` before writing any code.

---

## What Is Sicero?

Sicero is an AI-powered conversational shopping assistant. The core differentiator is **true conversational flow** — users can refine searches naturally ("only show gaming ones", "under $100") without losing context. This is NOT a search engine with a chat wrapper. Context retention across turns is a first-class product requirement.

The platform has two modes:
- **Shop Mode** — conversational product discovery and search
- **Plan Mode** — multi-item planning for events, gifts, bundles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript + React |
| LLM | OpenRouter → GPT-4o-mini |
| Product Search | SerpAPI (Google Shopping) |
| Database | (Kevin — not yet integrated) |
| Design | Figma |

---

## Team & Ownership

| Person | Domain |
|---|---|
| Daniel | LLM integration, web scraping, product management |
| Kevin | Backend infrastructure, databases |
| Eric | Planning, product vision |

Daniel is the emerging PM. When making architecture decisions, flag tradeoffs clearly so Daniel can make the call — don't just pick one path silently.

---

## Architecture Overview

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

### Critical Constraint: Context Management
The intent extraction system **must** receive the full conversation history on every turn. A message like "only show gaming ones" has zero meaning without prior context. **Root cause identified:** the intent extraction function was not being passed conversation history at all — it was operating stateless. Never strip or omit conversation history before the LLM call. This is a known past failure point.

---

## Key UI Components (already built)

- Agent avatar (`avatarsvg.tsx`) — animated SVG with idle / listening / speaking states
- Chat panel (`chatpanel.tsx`) — message history, auto-resize textarea, voice toggle, typing indicator, quick-action chips
- Voice input modal (`voicemodal.tsx`) — hold-to-speak, live transcript display, Done button submits (not mouse-up)
- Speech bubbles — rendered inside chat panel
- Product cards (`market.tsx`) — image, name, price, rating, match %, direct buy link
- Results panel (`resultspanel.tsx`) — filter bar (Top Match, All Results, Price ↑↓), product grid, empty state
- Right detail panel (`rightpanel.tsx`) — selected product full view (currently minimal)
- Auth modal (`authmodal.tsx`) — sign in / sign up tabs, localStorage persistence (NOT production-safe)
- Marketing landing page sections (`sections.tsx`) — TrustBar, HowSection, Features, Categories, Testimonials, CTA, Footer
- Header / navbar (`header.tsx`, `generalheader.tsx`) — two near-identical navbars exist; consolidation pending (C-05)

**Note:** The clarification modal component exists but its trigger is the `shouldSearch: false` path in the API route, not a separate modal UI. It surfaces as a chat message, not a popup.

---

## Coding Conventions

- TypeScript strictly — no `any` types without justification
- Keep LLM prompt logic in dedicated prompt files, not inline
- Conversation history must be passed as a typed array, not reconstructed from DOM
- When adding a feature, check `TODO.md` for the relevant backlog item and update its status

---

## Auth System (Current State)

Auth is implemented via `auth.tsx` (React context + localStorage). Users are stored under `sicero_users` and `sicero_current` keys. Passwords are encoded with `btoa()` — **this is not secure and must not go to production**. Replace with Kevin's backend before any real user-facing launch.

---

## Python Backend Services (Separate / Unintegrated)

Two Python services exist under `app/backend/` but are **not connected to the main Next.js app**:

- `conversation/main.py` — audio recording + Whisper transcription (spike detection, chunk merging). Superseded by the browser Speech Recognition API used in `voicemodal.tsx`.
- `evidence-finder/main.py` — FastAPI service for debate card-cutting research (Mojeek + ScrapingDog + Gemini). Entirely separate product; has hardcoded API keys — do not commit if keys are real.

---

## What NOT to Do

- Do not pivot the product scope mid-session without flagging it as a strategic decision
- Do not silently drop conversation history to simplify a function
- Do not add new dependencies without noting them here
- Do not implement Plan Mode features until Shop Mode core is stable
- Do not use the localStorage auth system as a model for real auth — it is a placeholder only

---

## Daniel's Workflow Pattern

- **Browser Claude (this chat)** — strategic decisions, market analysis, PRD drafting, architecture planning, PM work
- **Claude Code (IDE)** — specific feature implementation, debugging, code generation

Keep these contexts separate. Don't ask Claude Code to make product strategy calls; don't ask browser Claude to debug a TypeScript error.

---

## Session Startup Checklist

1. Read `PLAN.md` — understand current phase and priorities
2. Read `TODO.md` — know what's active, in-progress, and blocked
3. Ask Daniel to confirm the session goal before writing code
4. After the session, update `TODO.md` with status changes

---

## Auto-Update Rule (MANDATORY)

After completing **any** task in a session, update `TODO.md`:
- Move finished items to ✅ Completed with today's date
- Move newly discovered blockers to 🔴 Blocked with a one-line description
- Update 🟡 In Progress items with a short note on current state
- Add any new tasks that emerged during the session to ⚪ Backlog

After **significant** sessions (new feature shipped, architecture changed, strategic decision made), also update `PLAN.md`:
- Check off completed phase items
- Add a row to the Strategic Decisions Log with date + rationale
- Update the `_Last updated_` date at the top

> When Daniel pastes updated file contents into Browser Claude, that is the sync point for strategy and planning. Keep these files accurate — they are the single source of truth.
