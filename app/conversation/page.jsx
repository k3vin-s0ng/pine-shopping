"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/header";
import LeftPanel from "../components/conversation/LeftPanel";
import ProductGrid from "../components/conversation/ProductGrid";
import BottomBar from "../components/conversation/BottomBar";
import { useVoiceRecorder } from "../lib/useVoiceRecorder";

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

  // Returns a Promise that resolves after TTS finishes (or immediately if unavailable)
  function speak(text) {
    return new Promise((resolve) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1;

      // Same voice preference as useConvo.ts
      const applyVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find(
            (v) => v.lang === "en-US" && /samantha|google us english|zira/i.test(v.name)
          ) ?? voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      };
      applyVoice();
      // Voices list may be empty on first call — retry when loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", applyVoice, { once: true });
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  // Returns { chatResponse } so voice wrapper can speak the reply
  async function handleSubmit(text) {
    if (!text.trim()) return null;
    setStatus("Pine is thinking…");
    setLoading(true);

    // Snapshot prior history BEFORE mutating state — sent to API so extractIntent
    // can append the current message once. newHistory is only used for state.
    const priorHistory = [...history];
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);
    setQuery(text);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send priorHistory (without current message) — intentExtraction.ts appends userMessage itself
        body: JSON.stringify({ query: text, history: priorHistory, accumulatedIntent }),
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

  // Fire initial search on mount using the URL query param
  useEffect(() => {
    const saved = localStorage.getItem("orbData");
    localStorage.clear();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProducts(parsed.products || []);
        setLoading(false);
        setStatus("Pine is listening");
        return;
      } catch (err) {
        console.error("Could not parse orbData:", err);
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
