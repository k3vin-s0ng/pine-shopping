// [KEVIN - this hook is preserved for the Data Agent pipeline and future server-side STT integration]
// The home page orb no longer imports this directly — see orb.jsx for current pipeline.
"use client";

import { useRef, useState, useCallback } from "react";
import { searchProducts, ConversationTurn } from "./serpapi";
import { Product } from "./products";

interface HistoryMessage {
  role: "user" | "ai";
  content: string;
}

type AssistantFinishedMeta = {
  resultCount: number;
  products: Product[];
};

export interface UseConvoReturn {
  processTranscript: (
    transcript: string,
    options?: {
      onAssistantFinished?: (meta: AssistantFinishedMeta) => void;
    }
  ) => Promise<void>;
  isSpeaking: boolean;
  isThinking: boolean;
  stopSpeaking: () => void;
  reset: () => void;
}

export function useConvo(): UseConvoReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const historyRef = useRef<HistoryMessage[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, onEnd?: () => void): void => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.rate = 1.05;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) =>
          v.lang === "en-US" &&
          /samantha|google us english|zira/i.test(v.name)
      ) ??
      voices.find((v) => v.lang.startsWith("en"));

    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback((): void => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const processTranscript = useCallback(
    async (
      transcript: string,
      options?: {
        onAssistantFinished?: (meta: AssistantFinishedMeta) => void;
      }
    ): Promise<void> => {
      if (!transcript?.trim()) return;

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: transcript },
      ];

      setIsThinking(true);

      try {
        const { chatResponse, resultCount, products } = await searchProducts(
          transcript,
          historyRef.current as ConversationTurn[]
        );

        const reply = chatResponse || "Sorry, I didn't catch that.";

        historyRef.current = [
          ...historyRef.current,
          { role: "ai", content: reply },
        ];

        speak(reply, () => {
          options?.onAssistantFinished?.({ resultCount, products });
        });
      } catch (err) {
        console.error("useConvo error:", err);
        speak("Sorry, something went wrong. Please try again.", () => {
          options?.onAssistantFinished?.({ resultCount: 0, products: [] });
        });
      } finally {
        setIsThinking(false);
      }
    },
    [speak]
  );

  const reset = useCallback((): void => {
    stopSpeaking();
    historyRef.current = [];
  }, [stopSpeaking]);

  return {
    processTranscript,
    isSpeaking,
    isThinking,
    stopSpeaking,
    reset,
  };
}