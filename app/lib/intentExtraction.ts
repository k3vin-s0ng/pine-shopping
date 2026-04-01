import { OpenAI } from "openai";
import { INTENT_EXTRACTION_PROMPT } from "./prompts/intentExtractionPrompt";

export interface IntentExtractionResult {
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
  raw_intent_summary: string;
  confidence_score: number;
  clarification_needed: boolean;
  clarification_question?: string;
  chat_response?: string;
  // D4: vocabulary-derived expertise level — drives clarification question style
  user_expertise: "novice" | "intermediate" | "expert";
  // True when user switches to an incompatible product category — triggers accumulation reset
  is_pivot: boolean;
}

export interface HistoryMessage {
  role: "user" | "ai";
  content: string;
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "openai/gpt-4o-mini";

// ─── Strip HTML tags for clean LLM context ──────────────────────────────────

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

// ─── Main extraction function ────────────────────────────────────────────────

export async function extractIntent(
  userMessage: string,
  history?: HistoryMessage[]
): Promise<IntentExtractionResult> {
  const fallback: IntentExtractionResult = {
    hard_constraints: {},
    soft_preferences: {},
    search_query: userMessage,
    raw_intent_summary: userMessage,
    confidence_score: 0.6,
    clarification_needed: false,
    chat_response: "Searching for the best matches — one moment.",
    user_expertise: "intermediate",
    is_pivot: false,
  };

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[intentExtraction] OPENROUTER_API_KEY not set, using raw query fallback");
    return fallback;
  }

  // Build message array: system prompt + full conversation history + current message
  // CRITICAL: full history must always reach the LLM — see CLAUDE.md context retention note
  const historyMessages: { role: "user" | "assistant"; content: string }[] = (history || [])
    .filter((m) => m.content.trim())
    .map((m) => ({
      role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
      content: stripHtml(m.content),
    }));

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INTENT_EXTRACTION_PROMPT },
        ...historyMessages,
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[intentExtraction] Empty LLM response, using fallback");
      return fallback;
    }

    const parsed = JSON.parse(content);
    console.log("[intentExtraction] Extracted:", JSON.stringify(parsed));

    // Validate required fields; fall back if missing
    if (typeof parsed.search_query !== "string" || typeof parsed.confidence_score !== "number") {
      console.error("[intentExtraction] Schema validation failed, using fallback");
      return fallback;
    }

    return {
      hard_constraints: parsed.hard_constraints ?? {},
      soft_preferences: parsed.soft_preferences ?? {},
      search_query: parsed.search_query || userMessage,
      raw_intent_summary: parsed.raw_intent_summary || userMessage,
      confidence_score: parsed.confidence_score,
      clarification_needed: parsed.clarification_needed === true,
      clarification_question: parsed.clarification_question || undefined,
      chat_response: parsed.chat_response || undefined,
      user_expertise: parsed.user_expertise ?? "intermediate",
      is_pivot: parsed.is_pivot === true,
    };
  } catch (err) {
    console.error("[intentExtraction] Failed (parse error or API error), using fallback:", err);
    return fallback;
  }
}

// ─── D3: Preference accumulator ──────────────────────────────────────────────
// Merges a new extraction into the accumulated intent from prior turns.
// hard_constraints and soft_preferences are unioned forward — never dropped.
// user_expertise, confidence_score, clarification fields, and search_query
// always come from the latest turn.
//
// NOTE: The client-side merge in page.jsx duplicates this logic because
// intentExtraction.ts is server-only and cannot be imported by client components.
// Keep both in sync if you change the merge strategy.

export function mergeIntent(
  accumulated: Partial<IntentExtractionResult>,
  latest: IntentExtractionResult
): IntentExtractionResult {
  return {
    ...latest,
    hard_constraints: {
      ...accumulated.hard_constraints,
      ...latest.hard_constraints,
      must_have_attributes: [
        ...new Set([
          ...(accumulated.hard_constraints?.must_have_attributes ?? []),
          ...(latest.hard_constraints?.must_have_attributes ?? []),
        ]),
      ],
    },
    soft_preferences: {
      ...accumulated.soft_preferences,
      ...latest.soft_preferences,
      vibe_keywords: [
        ...new Set([
          ...(accumulated.soft_preferences?.vibe_keywords ?? []),
          ...(latest.soft_preferences?.vibe_keywords ?? []),
        ]),
      ],
    },
    user_expertise: latest.user_expertise,
    confidence_score: latest.confidence_score,
    clarification_needed: latest.clarification_needed,
    clarification_question: latest.clarification_question,
    chat_response: latest.chat_response,
    search_query: latest.search_query,
    is_pivot: latest.is_pivot,
  };
}
