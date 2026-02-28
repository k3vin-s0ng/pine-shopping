import { OpenAI } from "openai";

export interface Intent {
  shouldSearch: boolean;
  chatResponse: string;
  product: string;
  maxPrice?: number;
  minPrice?: number;
  mustHaves: string[];
  brand?: string;
}

export interface HistoryMessage {
  role: "user" | "ai";
  content: string;
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const SYSTEM_PROMPT = `You are Sicero, a sharp AI shopping concierge. Extract purchase intent from the conversation and respond ONLY with valid JSON:

{
  "shouldSearch": true | false,
  "chatResponse": "your reply (required, 1-2 sentences, warm and specific)",
  "product": "Google Shopping search term | null",
  "maxPrice": number | null,
  "minPrice": number | null,
  "mustHaves": ["feature1", "feature2"],
  "brand": "brand name | null"
}

SEARCH DECISIONS:
- shouldSearch: true → user has given enough to run a search (infer reasonable defaults, prefer searching over asking)
- shouldSearch: false → genuinely ambiguous; ask exactly ONE focused clarifying question

HISTORY AWARENESS (critical):
- Use the full conversation to resolve references like "cheaper ones", "that laptop", "a different brand", "make it wireless"
- For follow-up messages, carry forward product type and constraints from earlier turns unless the user explicitly changes them
- If the user refines with a price or feature, update just that field and keep all other context from history

SEARCH TERM RULES:
- Craft a focused, attribute-rich Google Shopping query (e.g. "noise-cancelling wireless headphones" not "headphones")
- Do NOT embed price in the product string — use maxPrice/minPrice fields instead
- For brand follow-ups, prepend the brand to the existing product term

chatResponse RULES:
- When searching: 1 sentence confirming what you're finding, referencing a key detail
- When clarifying: ask the single most important missing piece of info
- Never repeat the user's exact words back verbatim

EXAMPLES:
"I need headphones" → shouldSearch: false, ask about use case or budget
"wireless gaming headphones under $150" → shouldSearch: true, product: "wireless gaming headphones", maxPrice: 150
[history: gaming headphones search] "show me Sony ones" → shouldSearch: true, product: "Sony wireless gaming headphones", carry forward maxPrice
[history: gaming headphones search] "under $100" → shouldSearch: true, same product term, maxPrice: 100`;

// Strip HTML tags for clean LLM context
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

export async function extractIntent(
  userMessage: string,
  history?: HistoryMessage[]
): Promise<Intent> {
  const fallback: Intent = {
    shouldSearch: true,
    chatResponse: "Searching for the best matches — one moment 🔍",
    product: userMessage,
    mustHaves: [],
  };

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[intentExtraction] OPENROUTER_API_KEY not set, using raw query");
    return fallback;
  }

  // Build message array: system + conversation history + current message
  const historyMessages: { role: "user" | "assistant"; content: string }[] =
    (history || [])
      .filter((m) => m.content.trim())
      .map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: stripHtml(m.content),
      }));

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[intentExtraction] Empty LLM response");
      return fallback;
    }

    const parsed = JSON.parse(content);
    console.log("[intentExtraction] Extracted:", JSON.stringify(parsed));

    return {
      shouldSearch: parsed.shouldSearch === true,
      chatResponse: parsed.chatResponse || fallback.chatResponse,
      product: parsed.product || userMessage,
      maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : undefined,
      minPrice: typeof parsed.minPrice === "number" ? parsed.minPrice : undefined,
      mustHaves: Array.isArray(parsed.mustHaves) ? parsed.mustHaves : [],
      brand: parsed.brand || undefined,
    };
  } catch (err) {
    console.error("[intentExtraction] Failed:", err);
    return fallback;
  }
}
