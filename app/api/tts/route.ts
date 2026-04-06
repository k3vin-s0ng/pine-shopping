import { NextRequest, NextResponse } from "next/server";

const TTS_ENDPOINT = "https://api.inworld.ai/tts/v1/voice";
const VOICE_ID = "Ashley";
const MODEL_ID = "inworld-tts-1.5-mini";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { text } = (await req.json()) as { text: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.INWORLD_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "INWORLD_TTS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voiceId: VOICE_ID, modelId: MODEL_ID }),
  });

  const rawBody = await response.text();
  console.log("[TTS proxy] Inworld status:", response.status);
  console.log("[TTS proxy] Inworld raw response:", rawBody.slice(0, 500));

  if (!response.ok) {
    return NextResponse.json(
      { error: `Inworld TTS error ${response.status}: ${rawBody}` },
      { status: response.status }
    );
  }

  let data: { result?: { audioContent?: string }; audioContent?: string };
  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: `Inworld response was not JSON: ${rawBody.slice(0, 200)}` },
      { status: 502 }
    );
  }

  // Handle both { result: { audioContent } } and flat { audioContent } shapes
  const audioContent = data.result?.audioContent ?? data.audioContent;
  console.log("[TTS proxy] audioContent present:", !!audioContent, "length:", audioContent?.length ?? 0);

  if (!audioContent) {
    return NextResponse.json(
      { error: `No audioContent found. Response keys: ${Object.keys(data).join(", ")}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ audioContent });
}
