"use client"

import Navbar from "./components/header";
import Hero from "./components/hero";
import Curated from "./components/curated";
import InputBar from "./components/inputbar";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Curated />
      <InputBar />
    </main>
  );
}