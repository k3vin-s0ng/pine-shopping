"use client";

import { useState, useEffect } from "react";
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
  
export default function Page() {
  const router = useRouter();
  const [orbListening, setOrbListening] = useState(false);
  const [orbInterimText, setOrbInterimText] = useState("");

  // Clear any leftover conversation state from a previous session whenever the home page mounts.
  // pineHandoff carries orb history into /conversation — stale if the user navigated back.
  // orbData is written here but consumed nowhere; clear it to avoid accumulation.
  useEffect(() => {
    localStorage.removeItem("pineHandoff");
    localStorage.removeItem("orbData");
  }, []);

  const handleComplete = ({ products, resultCount }: OrbResult) => {
    localStorage.setItem("orbData", JSON.stringify({ products, resultCount }));
    router.push("/conversation");
  };

  return (
    <main>
      <Navbar />
      <Hero
        onComplete={handleComplete}
        onListeningChange={setOrbListening}
        onInterimTranscript={setOrbInterimText}
      />
      <Curated />
      <InputBar micActive={orbListening} interimValue={orbInterimText} />
    </main>
  );
}