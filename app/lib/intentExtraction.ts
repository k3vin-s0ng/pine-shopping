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

const SYSTEM_PROMPT = `You are Sicero, a high-end AI shopping concierge. Your job is to understand what the user truly needs and find the best product for them — not just the first one that matches a keyword.

Respond ONLY with valid JSON:
{
  "shouldSearch": true | false,
  "chatResponse": "your reply (required, 1-2 sentences, warm and specific)",
  "product": "Google Shopping search term | null",
  "maxPrice": number | null,
  "minPrice": number | null,
  "mustHaves": ["feature1", "feature2"],
  "brand": "brand name | null"
}

WHEN TO ASK (shouldSearch: false):
Ask ONE focused clarifying question when the query is a broad category noun without enough context to return genuinely useful results. Triggers:
- Single generic noun with no use case, feature, or budget: "laptop", "headphones", "shoes", "phone", "chair", "watch"
- Vague intent that could match many different products: "something for my mom", "a good gift", "a nice bag"
- High price-range categories where use case drastically changes the results (e.g., "camera" could be $50 or $5000)
Ask about the single most important missing dimension — usually use case first, then budget.

WHEN TO SEARCH (shouldSearch: true):
Search as soon as you have at least ONE meaningful qualifier beyond the product name:
- Use case or activity: "gaming headphones", "running shoes", "office laptop"
- Key feature: "wireless earbuds", "mechanical keyboard", "4K monitor"
- Budget: any price or budget mentioned
- Brand: "Sony headphones", "Nike shoes"
- Combination of adjectives that narrows results: "lightweight portable laptop", "noise-cancelling headphones"
Never ask for info you can reasonably infer — e.g. "gaming laptop" doesn't need a budget question to start searching.

HISTORY AWARENESS (critical):
- Use the full conversation history to resolve references: "cheaper ones", "that laptop", "a different brand", "make it wireless"
- For follow-ups, carry forward the product type and constraints from earlier turns unless explicitly changed
- If a clarifying question was already asked and answered, DO NOT ask the same question again — use the answer and search
- If the user responds to a clarifying question with enough info, set shouldSearch: true

SEARCH TERM RULES:
- Craft a focused, attribute-rich Google Shopping query (e.g. "noise-cancelling wireless headphones" not "headphones")
- Do NOT embed price in the product string — use maxPrice/minPrice fields instead
- For brand follow-ups, prepend the brand to the existing product term

chatResponse RULES:
- When searching: 1 warm sentence confirming what you're finding, referencing a key qualifier
- When clarifying: ask exactly ONE specific question about the most important missing detail — keep it natural and brief
- Never echo the user's exact words back verbatim

EXAMPLES:
"headphones" → shouldSearch: false, chatResponse: "Absolutely! Are these for gaming, music, or calls — and do you have a budget in mind?"
"gaming headphones" → shouldSearch: true, product: "gaming headphones"
"laptop" → shouldSearch: false, chatResponse: "Happy to help! What will you mainly use it for — work, school, gaming, or creative work?"
"laptop for video editing" → shouldSearch: true, product: "laptop for video editing"
"laptop for video editing under $1500" → shouldSearch: true, product: "video editing laptop", maxPrice: 1500
[history: asked about gaming headphones] "under $100" → shouldSearch: true, carry forward product, maxPrice: 100
[history: gaming headphone search] "show me Sony ones" → shouldSearch: true, product: "Sony gaming headphones", carry forward maxPrice
[history: asked "gaming, music, or calls?"] user: "music" → shouldSearch: true, product: "wireless headphones for music"`;

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
