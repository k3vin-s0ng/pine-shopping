"use client";

import { useState, useCallback, useRef } from "react";
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

function parseBudget(msg: string): { value: number; dir: "max" | "min" } | null {
  const minMatch = msg.match(/(?:over|above|more than|at least|minimum|min|\+)\s*\$?(\d[\d,]*)/i);
  if (minMatch) return { value: parseFloat(minMatch[1].replace(/,/g, "")), dir: "min" };
  const maxMatch =
    msg.match(/(?:under|below|less than|up to|max(?:imum)?|at most|budget of?)\s*\$?(\d[\d,]*)/i) ??
    msg.match(/\$(\d[\d,]*)/);
  if (maxMatch) return { value: parseFloat(maxMatch[1].replace(/,/g, "")), dir: "max" };
  return null;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: `Hey! I'm <strong>Pine</strong> — your AI shopping concierge. 👋<br/><br/>Tell me what you're after and I'll pull real products with prices and buy links right now. You can also tap the avatar or 🎙 to use your voice!`,
      html: true,
      time: now(),
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const originalProductsRef = useRef<Product[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  // Sync ref so processMessage always reads the latest messages without stale closure
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random() },
    ]);
  }, []);

  const processMessage = useCallback(
    async (text: string) => {
      // Capture history BEFORE adding the current user message
      const historySnapshot = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

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
      const baseProducts = originalProductsRef.current.length ? originalProductsRef.current : allProducts;
      if ((hasCheaper || hasMore || hasBudget) && baseProducts.length > 0) {
        let filtered = [...baseProducts];
        if (hasCheaper) {
          const minPrice = Math.min(...filtered.map((p) => p.num));
          filtered = filtered.filter((p) => p.num <= minPrice * 0.85);
          if (!filtered.length)
            filtered = baseProducts.slice().sort((a, b) => a.num - b.num).slice(0, 2);
        }
        if (hasBudget)
          filtered = filtered.filter((p) =>
            hasBudget.dir === "min" ? p.num >= hasBudget.value : p.num <= hasBudget.value
          );
        if (!filtered.length)
          filtered = baseProducts.slice().sort((a, b) => a.num - b.num).slice(0, 3);

        const ack = hasCheaper
          ? "Here are the more budget-friendly options from your results 👇"
          : hasBudget
          ? hasBudget.dir === "min"
            ? `Showing options over $${hasBudget.value}:`
            : `Filtered to options under $${hasBudget.value}:`
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

      try {
        const { products: results, chatResponse } = await searchProducts(text, historySnapshot);

        // LLM asked a clarifying question — show it, don't update products
        if (!results.length && chatResponse) {
          addMessage({ role: "ai", content: chatResponse, html: false, time: now() });
          return;
        }

        let filtered = results;
        if (hasBudget)
          filtered = filtered.filter((p) =>
            hasBudget.dir === "min" ? p.num >= hasBudget.value : p.num <= hasBudget.value
          );
        if (!filtered.length) filtered = results;

        originalProductsRef.current = filtered;
        setAllProducts(filtered);
        setProducts(filtered.slice(0, 3));
        addMessage({
          role: "ai",
          content: chatResponse || "Here are the best matches I found for you!",
          html: false,
          time: now(),
        });
      } catch {
        // Fallback to mock data if the API call fails entirely
        const lo = text.toLowerCase();
        const hit = INTENTS.find((r) => r.kw.some((k) => lo.includes(k)));
        const keys = Object.keys(DB);
        const fallback = hit ? DB[hit.db] : DB[keys[count % keys.length]];
        originalProductsRef.current = fallback;
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
    originalProductsRef.current = [];
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