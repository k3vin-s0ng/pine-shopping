"use client";

import { useState, useEffect } from "react";
import Header from "./components/ui/header";
import { InputBar } from "./components/InputBar";
import { ExampleChip } from "./components/ExampleChip";
import { FilterPill } from "./components/FilterPill";
import { LoadingStepper } from "./components/LoadingStepper";
import { ProductCard } from "./components/ProductCard";
import { ClarifyModal } from "./components/ClarifyModal";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { CompareView } from "./components/CompareView";
import { mockProducts, exampleQueries, Product } from "./data/mockProducts";

type AppView = "home" | "loading" | "clarify" | "results" | "compare" | "empty" | "error";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [query, setQuery] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [confidence] = useState<"Low" | "Medium" | "High">("High");

  useEffect(() => {
    if (view === "loading") {
      const intervals = [1000, 1500, 1200];
      let currentStep = 0;

      const progressLoading = () => {
        if (currentStep < 3) {
          setLoadingStep(currentStep);
          currentStep++;
          setTimeout(progressLoading, intervals[currentStep - 1] || 1000);
        } else {
          const shouldClarify = Math.random() > 0.7;
          if (shouldClarify) {
            setView("clarify");
          } else {
            showResults();
          }
        }
      };

      progressLoading();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleSearch = () => {
    if (!query.trim()) return;

    const extractedFilters: string[] = [];
    if (query.toLowerCase().includes("prime")) extractedFilters.push("Prime");
    const priceMatch = query.match(/under \$(\d+)/i);
    if (priceMatch) extractedFilters.push(`≤ $${priceMatch[1]}`);
    if (query.toLowerCase().includes("rating")) extractedFilters.push("≥ 4.2★");

    setFilters(extractedFilters);
    setView("loading");
    setLoadingStep(0);
  };

  const showResults = () => {
    setProducts(mockProducts);
    setView("results");
  };

  const handleClarify = (budget: string, primeOnly: boolean) => {
    const newFilters = [...filters];
    if (budget) {
      const existingBudgetIndex = newFilters.findIndex((f) => f.includes("$"));
      if (existingBudgetIndex >= 0) {
        newFilters[existingBudgetIndex] = `≤ ${budget}`;
      } else {
        newFilters.push(`≤ ${budget}`);
      }
    }
    if (primeOnly && !newFilters.includes("Prime")) {
      newFilters.push("Prime");
    }
    setFilters(newFilters);
    showResults();
  };

  const handleEditQuery = () => {
    setView("home");
  };

  const handleCancel = () => {
    setView("home");
    setLoadingStep(0);
  };

  const handleRelaxConstraint = (_constraint: string) => {
    showResults();
  };

  const handleRetry = () => {
    setView("loading");
    setLoadingStep(0);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Home View */}
      {view === "home" && (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 pt-[72px]">
          <div className="max-w-[840px] w-full space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold">
                Describe what you want. Get the best 3 options.
              </h1>
              <p className="text-muted-foreground">
                Amazon-only MVP. Fast shortlist + clear reasoning.
              </p>
            </div>

            <InputBar value={query} onChange={setQuery} onSearch={handleSearch} />

            <div className="flex flex-wrap gap-2 justify-center">
              {exampleQueries.map((example, index) => (
                <ExampleChip
                  key={index}
                  text={example}
                  onClick={() => setQuery(example)}
                />
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              We don't buy for you — we shortlist and link out.
            </p>
          </div>
        </div>
      )}

      {/* Loading View */}
      {view === "loading" && (
        <div className="min-h-screen pt-[72px]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
            <div className="mb-8">
              <InputBar value={query} onChange={setQuery} onSearch={() => {}} disabled />
            </div>
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-full max-w-[560px] bg-card border border-border rounded-lg p-8 space-y-8">
                <LoadingStepper currentStep={loadingStep} />
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleEditQuery}
                    className="px-6 h-10 bg-transparent text-foreground rounded-md hover:bg-accent transition-colors"
                  >
                    Edit query
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 h-10 bg-transparent text-foreground rounded-md hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  We'll show top 3 results with reasons. No hallucinated specs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clarify Modal */}
      {view === "clarify" && (
        <ClarifyModal
          onContinue={handleClarify}
          onSkip={showResults}
          onClose={handleCancel}
        />
      )}

      {/* Results View */}
      {view === "results" && (
        <div className="min-h-screen pt-[72px]">
          <div className="sticky top-[72px] bg-background border-b border-border z-40">
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <InputBar value={query} onChange={setQuery} onSearch={handleSearch} />
                </div>
              </div>
              {filters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {filters.map((filter, index) => (
                    <FilterPill key={index} text={filter} onRemove={() => removeFilter(index)} />
                  ))}
                  <div className="flex gap-2 ml-4">
                    <button className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors">
                      Cheaper
                    </button>
                    <button className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors">
                      Higher-rated
                    </button>
                    <button className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors">
                      Faster shipping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <h2 className="text-xl font-semibold">Top 3 matches</h2>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onCompare={() => setView("compare")}
                  />
                ))}
              </div>

              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-[200px]">
                  <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold">Best pick for you</h3>
                    <p className="text-sm text-muted-foreground">
                      {products[0]?.title.slice(0, 50)}… offers the best combination of
                      features, price, and verified quality for your needs.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Confidence:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          confidence === "High"
                            ? "bg-green-100 text-green-800"
                            : confidence === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {confidence}
                      </span>
                    </div>
                    <button
                      onClick={() => setView("compare")}
                      className="w-full px-6 h-10 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Compare all 3
                    </button>
                    <button className="w-full px-6 h-10 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                      Relax constraints
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare View */}
      {view === "compare" && (
        <CompareView products={products} onBack={() => setView("results")} />
      )}

      {/* Empty State */}
      {view === "empty" && (
        <div className="min-h-screen pt-[72px]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
            <div className="mb-8">
              <InputBar value={query} onChange={setQuery} onSearch={handleSearch} />
            </div>
            <EmptyState
              onRelaxConstraint={handleRelaxConstraint}
              relaxOptions={[
                "Increase budget to $150",
                "Allow non-Prime",
                "Lower min rating to 4.0",
                "Expand category",
              ]}
            />
            <div className="space-y-6 mt-8">
              <h3 className="text-lg font-semibold">Closest matches</h3>
              {products.slice(0, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCompare={() => setView("compare")}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {view === "error" && (
        <div className="min-h-screen pt-[72px]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
            <div className="mb-8">
              <InputBar value={query} onChange={setQuery} onSearch={handleSearch} />
            </div>
            <ErrorState onRetry={handleRetry} onEditQuery={handleEditQuery} />
          </div>
        </div>
      )}
    </div>
  );
}
