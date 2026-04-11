"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./components/header";
import Hero from "./components/hero";
import Curated from "./components/curated";
import InputBar from "./components/inputbar";
import type { Product } from "./lib/products";

type OrbResult = {
  products: Product[];
  resultCount: number;
};

type HistoryEntry = { role: string; content: string };
type AccumulatedIntent = Record<string, unknown>;

export default function Page() {
  const router = useRouter();
  const [orbListening, setOrbListening] = useState(false);
  const [orbInterimText, setOrbInterimText] = useState("");

  // Typed input bar state — mirrors orb's historyRef / accumulatedIntentRef
  const [inputLoading, setInputLoading] = useState(false);
  const [inputClarification, setInputClarification] = useState<string | null>(null);
  const inputHistoryRef = useRef<HistoryEntry[]>([]);
  const inputAccumulatedIntentRef = useRef<AccumulatedIntent>({});

  // Clear any leftover conversation state from a previous session whenever the home page mounts.
  useEffect(() => {
    localStorage.removeItem("pineHandoff");
    localStorage.removeItem("orbData");
    // Reset typed-input flow state on each home page visit
    inputHistoryRef.current = [];
    inputAccumulatedIntentRef.current = {};
    setInputClarification(null);
  }, []);

  const handleComplete = ({ products, resultCount }: OrbResult) => {
    localStorage.setItem("orbData", JSON.stringify({ products, resultCount }));
    router.push("/conversation");
  };

  async function handleInputSubmit(text: string) {
    if (!text.trim()) return;
    setInputLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: inputHistoryRef.current,
          accumulatedIntent: inputAccumulatedIntentRef.current,
        }),
      });
      const data = await res.json();

      // Append turns to local history
      inputHistoryRef.current = [
        ...inputHistoryRef.current,
        { role: "user", content: text },
        ...(data.chatResponse ? [{ role: "ai", content: data.chatResponse }] : []),
      ];

      // Merge intent — mirrors orb.jsx and conversation/page.jsx
      if (data.intent) {
        const prev = inputAccumulatedIntentRef.current as {
          hard_constraints?: { must_have_attributes?: string[] };
          soft_preferences?: { vibe_keywords?: string[] };
        };
        inputAccumulatedIntentRef.current = {
          ...data.intent,
          hard_constraints: {
            ...prev.hard_constraints,
            ...data.intent.hard_constraints,
            must_have_attributes: [
              ...new Set([
                ...(prev.hard_constraints?.must_have_attributes ?? []),
                ...(data.intent.hard_constraints?.must_have_attributes ?? []),
              ]),
            ],
          },
          soft_preferences: {
            ...prev.soft_preferences,
            ...data.intent.soft_preferences,
            vibe_keywords: [
              ...new Set([
                ...(prev.soft_preferences?.vibe_keywords ?? []),
                ...(data.intent.soft_preferences?.vibe_keywords ?? []),
              ]),
            ],
          },
        };
      }

      if (data.clarificationNeeded) {
        setInputClarification(data.chatResponse || data.intent?.clarification_question || null);
      } else {
        localStorage.setItem("pineHandoff", JSON.stringify({
          history: inputHistoryRef.current,
          accumulatedIntent: inputAccumulatedIntentRef.current,
          lastQuery: text,
          products: data.products || [],
          chatResponse: data.chatResponse || "",
        }));
        router.push("/conversation");
      }
    } catch (err) {
      console.error("[InputBar] handleInputSubmit error:", err);
    } finally {
      setInputLoading(false);
    }
  }

  return (
    <main>
      <Navbar />
      <Hero
        onComplete={handleComplete}
        onListeningChange={setOrbListening}
        onInterimTranscript={setOrbInterimText}
      />
      <Curated />
      <InputBar
        micActive={orbListening}
        interimValue={orbInterimText}
        onSubmit={handleInputSubmit}
        isLoading={inputLoading}
        clarificationQuestion={inputClarification}
      />
    </main>
  );
}