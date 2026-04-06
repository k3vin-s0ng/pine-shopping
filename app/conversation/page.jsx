"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/header";
import LeftPanel from "../components/conversation/LeftPanel";
import ProductGrid from "../components/conversation/ProductGrid";
import BottomBar from "../components/conversation/BottomBar";
import { useVoiceRecorder } from "../lib/useVoiceRecorder";
import { speakWithInworld } from "../lib/tts/inworldTTS";

function ConversationView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [chatResponse, setChatResponse] = useState("");
  const [clarificationNeeded, setClarificationNeeded] = useState(false);
  const [status, setStatus] = useState("Pine is thinking…");
  const [loading, setLoading] = useState(true);
  const [refineChips, setRefineChips] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bottomInput, setBottomInput] = useState("");
  // D3: accumulated intent — merges hard_constraints and soft_preferences forward across turns
  // Client-side merge mirrors mergeIntent() in intentExtraction.ts (server-only, not importable here)
  const [accumulatedIntent, setAccumulatedIntent] = useState({});

  async function speak(text) {
    if (!text) return;
    setIsSpeaking(true);
    try {
      await speakWithInworld(text);
    } finally {
      setIsSpeaking(false);
    }
  }

  // Returns { chatResponse } so voice wrapper can speak the reply.
  // opts.priorHistory / opts.priorAccumulatedIntent override React state snapshots —
  // used on mount when pineHandoff data is available before state has hydrated.
  async function handleSubmit(text, opts = {}) {
    if (!text.trim()) return null;
    setStatus("Pine is thinking…");
    setLoading(true);

    // Snapshot prior history BEFORE mutating state — sent to API so extractIntent
    // can append the current message once. newHistory is only used for state.
    const priorHistory = opts.priorHistory ?? [...history];
    const currentIntent = opts.priorAccumulatedIntent ?? accumulatedIntent;
    const newHistory = [...priorHistory, { role: "user", content: text }];
    setHistory(newHistory);
    setQuery(text);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send priorHistory (without current message) — intentExtraction.ts appends userMessage itself
        body: JSON.stringify({ query: text, history: priorHistory, accumulatedIntent: currentIntent }),
      });

      const data = await res.json();

      if (data.intent?.is_pivot) {
        // Pivot: user changed category — reset history to only current turn so old context
        // doesn't corrupt future turns' accumulation
        console.log("[AccumulatedIntent] Pivot detected — resetting accumulated intent");
        const pivotHistory = [{ role: "user", content: text }];
        if (data.chatResponse) pivotHistory.push({ role: "ai", content: data.chatResponse });
        setHistory(pivotHistory);
        setAccumulatedIntent(data.intent);
      } else {
        if (data.chatResponse) {
          setHistory((prev) => [...prev, { role: "ai", content: data.chatResponse }]);
        }
        // D3: merge new intent into accumulated state so constraints carry forward across turns
        // Mirrors mergeIntent() in intentExtraction.ts — keep in sync if merge strategy changes
        if (data.intent) {
          setAccumulatedIntent((prev) => ({
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
          }));
        }
      }

      setProducts(data.products || []);
      setChatResponse(data.chatResponse || "");
      setClarificationNeeded(data.clarificationNeeded === true);
      setStatus("Pine is listening");

      // Build refine chips from the query keywords for quick follow-up
      if (data.products && data.products.length > 0) {
        const cats = [...new Set(data.products.slice(0, 3).map((p) => p.cat).filter(Boolean))];
        setRefineChips([
          "Under $100",
          "Best rated",
          ...cats.slice(0, 2).map((c) => `More ${c}`),
        ]);
      } else {
        setRefineChips([]);
      }

      return { chatResponse: data.chatResponse || "" };
    } catch (err) {
      console.error("[ConversationPage] Search failed:", err);
      setChatResponse("Something went wrong. Please try again.");
      setProducts([]);
      setStatus("Pine is listening");
      return { chatResponse: "Something went wrong. Please try again." };
    } finally {
      setLoading(false);
    }
  }

  // Voice entry point: submit the transcript then speak the reply.
  // Returning a Promise here means the recorder awaits this before restarting (continuous mode).
  async function handleVoiceQuery(text) {
    const result = await handleSubmit(text);
    if (result?.chatResponse) {
      await speak(result.chatResponse);
    }
  }

  // Hook called after function definitions so handleVoiceQuery is in scope.
  // The ref inside the hook always calls the latest version regardless of order.
  const { listening: voiceListening, processing: voiceProcessing, toggle: toggleVoice } =
    useVoiceRecorder({
      onTranscript: handleVoiceQuery,
      onInterimTranscript: (text) => setBottomInput(text),
      continuous: true,
    });

  function handleRestart() {
    window.speechSynthesis?.cancel();
    setAccumulatedIntent({});
    localStorage.clear();
    router.push("/");
  }

  function handleStop() {
    setLoading(false);
    setStatus("Pine is listening");
  }

  function handleRefine(chipText) {
    handleSubmit(chipText);
  }

  // Fire initial search on mount
  useEffect(() => {
    const raw = localStorage.getItem("pineHandoff");
    if (raw) {
      localStorage.removeItem("pineHandoff");
      try {
        const parsed = JSON.parse(raw);
        // Hydrate accumulatedIntent into state so subsequent turns inherit it.
        // priorHistory and priorAccumulatedIntent are passed directly to handleSubmit
        // because React state setters are async — the closure would see stale [] otherwise.
        const handoffIntent = parsed.accumulatedIntent || {};
        setAccumulatedIntent(handoffIntent);
        handleSubmit(parsed.lastQuery, {
          priorHistory: parsed.history || [],
          priorAccumulatedIntent: handoffIntent,
        });
        return;
      } catch (err) {
        console.error("[ConversationPage] Could not parse pineHandoff:", err);
      }
    }

    if (initialQuery) {
      handleSubmit(initialQuery);
    } else {
      setLoading(false);
      setStatus("Pine is listening");
    }
  }, []);

  return (
    <div className="conv-shell">
      <Navbar />
      <div className="conv-body">
        <LeftPanel
          query={query}
          status={status}
          onRestart={handleRestart}
          onStop={handleStop}
          onRefine={handleRefine}
          refineChips={refineChips}
          listening={voiceListening}
          processing={voiceProcessing}
          speaking={isSpeaking}
          onOrbClick={toggleVoice}
        />
        <div className="conv-right">
          <div className="cards-area">
            <ProductGrid
              products={products}
              loading={loading}
              chatResponse={chatResponse}
              clarificationNeeded={clarificationNeeded}
            />
          </div>
          <BottomBar
            onSubmit={handleSubmit}
            onMicClick={toggleVoice}
            micActive={voiceListening || voiceProcessing || isSpeaking}
            inputValue={bottomInput}
            setInputValue={setBottomInput}
          />
        </div>
      </div>
    </div>
  );
}

// Suspense boundary required by Next.js App Router for useSearchParams()
export default function ConversationPage() {
  return (
    <Suspense fallback={null}>
      <ConversationView />
    </Suspense>
  );
}
 