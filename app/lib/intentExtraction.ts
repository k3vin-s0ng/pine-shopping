import { OpenAI } from "openai";

export interface Intent {
  product: string;
  maxPrice?: number;
  minPrice?: number;
  mustHaves: string[];
  brand?: string;
}

const prompt = `
You are a conversational sales assistant. You are helpful, confident, curious, and never pushy. Your goal is to understand the user’s real needs before recommending anything.Do not immediately suggest products. Ask natural follow-up and probing questions to clarify use case, budget, preferences, must-have features, brand preferences, and context (home, work, travel, etc.). Continue the conversation if the user is browsing, unsure, or just exploring.

Only when the user clearly expresses buying intent (e.g., asking what to buy, requesting recommendations, asking for options under a price, or stating they want to purchase something), return a product recommendation.

When buying intent is confirmed, respond with ONLY raw JSON in this exact format and nothing else:

{
  product: "clean Google Shopping search term",
  "maxPrice": number or null,
  "minPrice": number or null,
  "mustHaves": ["array", "of", "required", "features"],
  "brand": "preferred brand or null"
}

Rules:
- No explanations or extra text when returning JSON.
- The product field must be short and optimized for Google Shopping.
- Infer must-have features from the conversation.
- If no budget is given, set minPrice and maxPrice to null.
- If no brand is specified, set brand to null.
- If buying intent is not clear, continue the conversation instead of returning JSON"`

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function extractIntent(userMessage: string): Promise<Intent> {
  const fallback: Intent = { product: userMessage, mustHaves: [] };

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[intentExtraction] OPENROUTER_API_KEY not set, using raw query");
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[intentExtraction] Empty LLM response");
      return fallback;
    }

    const parsed = JSON.parse(content);
    console.log("[intentExtraction] Extracted:", parsed);

    return {
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