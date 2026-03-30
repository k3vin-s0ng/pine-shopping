"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/header";
import LeftPanel from "../components/conversation/LeftPanel";
import ProductGrid from "../components/conversation/ProductGrid";
import BottomBar from "../components/conversation/BottomBar";

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
  const [micActive, setMicActive] = useState(false);
  const [bottomInput, setBottomInput] = useState("");

  async function handleSubmit(text) {
    if (!text.trim()) return;
    setStatus("Pine is thinking…");
    setLoading(true);

    // Add user message to history BEFORE the API call (CLAUDE.md: never drop history)
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);
    setQuery(text);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, history: newHistory }),
      });

      const data = await res.json();

      if (data.chatResponse) {
        setHistory((prev) => [...prev, { role: "ai", content: data.chatResponse }]);
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
    } catch (err) {
      console.error("[ConversationPage] Search failed:", err);
      setChatResponse("Something went wrong. Please try again.");
      setProducts([]);
      setStatus("Pine is listening");
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
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
    if (initialQuery) {
      handleSubmit(initialQuery);
    } else {
      setLoading(false);
      setStatus("Pine is listening");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        />
        <div className="conv-right">
          <div className="conv-results">
            <ProductGrid
              products={products}
              loading={loading}
              chatResponse={chatResponse}
              clarificationNeeded={clarificationNeeded}
            />
          </div>
          <BottomBar
            onSubmit={handleSubmit}
            onMicClick={() => setMicActive((m) => !m)}
            micActive={micActive}
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
