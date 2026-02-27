import { OpenAI } from "openai";

export interface Intent {
  product: string;
  maxPrice?: number;
  minPrice?: number;
  mustHaves: string[];
  brand?: string;
}

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
          content: `Extract shopping intent from the user's message. Return ONLY valid JSON with these exact fields:
{
  "product": "clean Google Shopping search term (e.g. noise canceling headphones wireless)",
  "maxPrice": number or null,
  "minPrice": number or null,
  "mustHaves": ["array", "of", "required", "features"],
  "brand": "preferred brand or null"
}`,
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