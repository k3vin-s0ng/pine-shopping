"use client";

import { useState, useCallback } from "react";
import { DB, INTENTS, Product } from "./products";
import { searchProducts } from "./serpapi";

export interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  html?: boolean;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseBudget(msg: string): number | null {
  const m = msg.match(/\$?(\d[\d,]*)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: `Hey! I'm <strong>Sicero</strong> — your AI shopping concierge. 👋<br/><br/>Tell me what you're after and I'll pull real products with prices and buy links right now. You can also tap the avatar or 🎙 to use your voice!`,
      html: true,
      time: now(),
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random() },
    ]);
  }, []);

  const processMessage = useCallback(
    async (text: string) => {
      const lo = text.toLowerCase();
      const count = msgCount + 1;
      setMsgCount(count);
      setIsTyping(true);
      setIsSearching(true);

      addMessage({ role: "user", content: text, time: now() });

      const hasCheaper =
        /cheaper|budget|under \$|less than|affordable|lower price|save money|discount/i.test(text);
      const hasMore =
        /more|show more|other|different|alternatives|options|else/i.test(text);
      const hasBudget = parseBudget(text);

      // Refinement on existing results (no new search needed)
      if ((hasCheaper || hasMore || hasBudget) && allProducts.length > 0) {
        let filtered = [...allProducts];
        if (hasCheaper) {
          const minPrice = Math.min(...filtered.map((p) => p.num));
          filtered = filtered.filter((p) => p.num <= minPrice * 0.85);
          if (!filtered.length)
            filtered = allProducts.slice().sort((a, b) => a.num - b.num).slice(0, 2);
        }
        if (hasBudget) filtered = filtered.filter((p) => p.num <= hasBudget);
        if (!filtered.length)
          filtered = allProducts.slice().sort((a, b) => a.num - b.num).slice(0, 3);

        const ack = hasCheaper
          ? "Here are the more budget-friendly options from your results 👇"
          : hasBudget
          ? `Filtered to options under $${hasBudget}:`
          : hasMore
          ? "Here are more alternatives for you:"
          : "Updated picks based on your preference:";

        addMessage({ role: "ai", content: ack, html: false, time: now() });
        setAllProducts(filtered);
        setProducts(filtered.slice(0, 3));
        setIsTyping(false);
        setIsSearching(false);
        return;
      }

      // Find intent for acknowledgment message
      const hit = INTENTS.find((r) => r.kw.some((k) => lo.includes(k)));
      const ack = hit
        ? hit.ack
        : "Searching for the best matches — one moment 🔍";
      addMessage({ role: "ai", content: ack, html: false, time: now() });

      try {
        const results = await searchProducts({ query: text, maxResults: 10 });
        let filtered = results;
        if (hasBudget) filtered = filtered.filter((p) => p.num <= hasBudget);
        if (!filtered.length) filtered = results;

        setAllProducts(filtered);
        setProducts(filtered.slice(0, 3));

        if (hit) {
          const words = text.trim().split(/\s+/).length;
          if (words <= 2 && !hasBudget && count <= 5 && hit.clarify.length) {
            setTimeout(() => {
              const q = hit.clarify[Math.floor(Math.random() * hit.clarify.length)];
              addMessage({
                role: "ai",
                content: `Quick question to sharpen these further — ${q}`,
                html: false,
                time: now(),
              });
            }, 1200);
          }
        }
      } catch {
        // Fallback to mock data if SerpAPI fails
        const keys = Object.keys(DB);
        const fallback = hit ? DB[hit.db] : DB[keys[count % keys.length]];
        setAllProducts(fallback);
        setProducts(fallback.slice(0, 3));
        addMessage({
          role: "ai",
          content: "Here are some popular picks while our search catches up:",
          html: false,
          time: now(),
        });
      } finally {
        setIsTyping(false);
        setIsSearching(false);
      }
    },
    [msgCount, allProducts, addMessage]
  );

  const filterProducts = useCallback(
    (mode: "top" | "all" | "low" | "high") => {
      if (!allProducts.length) return;
      let sorted = [...allProducts];
      if (mode === "top") {
        sorted = sorted
          .sort((a, b) => parseFloat(b.match) - parseFloat(a.match))
          .slice(0, 3);
      } else if (mode === "all") {
        sorted.sort((a, b) => parseFloat(b.match) - parseFloat(a.match));
      } else if (mode === "low") {
        sorted.sort((a, b) => a.num - b.num);
      } else if (mode === "high") {
        sorted.sort((a, b) => b.num - a.num);
      }
      setProducts(sorted);
    },
    [allProducts]
  );

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome-reset",
        role: "ai",
        content: "Chat cleared — what are you looking for? I'll find it right away!",
        html: false,
        time: now(),
      },
    ]);
    setProducts([]);
    setAllProducts([]);
    setMsgCount(0);
  }, []);

  const addAIMessage = useCallback(
    (content: string, html = false) => {
      addMessage({ role: "ai", content, html, time: now() });
    },
    [addMessage]
  );

  return {
    messages,
    products,
    allProducts,
    isTyping,
    isSearching,
    processMessage,
    filterProducts,
    clearChat,
    addAIMessage,
  };
}