"use client";

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

  const handleComplete = ({ products, resultCount }: OrbResult) => {
    localStorage.setItem("orbData", JSON.stringify({ products, resultCount }));
    router.push("/conversation");
  };

  return (
    <main>
      <Navbar />
      <Hero onComplete={handleComplete} />
      <Curated />
      <InputBar />
    </main>
  );
}