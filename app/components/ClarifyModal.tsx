"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface ClarifyModalProps {
  onContinue: (budget: string, primeOnly: boolean) => void;
  onSkip: () => void;
  onClose: () => void;
}

const budgetOptions = ["$25", "$50", "$100", "$150", "$250+"];

export function ClarifyModal({ onContinue, onSkip, onClose }: ClarifyModalProps) {
  const [selectedBudget, setSelectedBudget] = useState("");
  const [customBudget, setCustomBudget] = useState("");
  const [primeOnly, setPrimeOnly] = useState(false);

  const handleContinue = () => {
    const budget = selectedBudget === "Custom" ? customBudget : selectedBudget;
    onContinue(budget, primeOnly);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-[560px] p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl">Quick question so I can get this right</h2>

        <div className="space-y-3">
          <label className="block text-sm">What's your budget?</label>
          <div className="flex flex-wrap gap-2">
            {budgetOptions.map((budget) => (
              <button
                key={budget}
                onClick={() => { setSelectedBudget(budget); setCustomBudget(""); }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedBudget === budget
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {budget}
              </button>
            ))}
            <button
              onClick={() => setSelectedBudget("Custom")}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedBudget === "Custom"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              }`}
            >
              Custom
            </button>
          </div>
          {selectedBudget === "Custom" && (
            <input
              type="text"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder="Enter amount, e.g. $75"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm">Prime shipping?</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPrimeOnly(true)}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                primeOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              }`}
            >
              Prime only
            </button>
            <button
              onClick={() => setPrimeOnly(false)}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                !primeOnly
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              }`}
            >
              Any
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleContinue}
            className="flex-1 px-6 h-12 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onSkip}
            className="px-6 h-12 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
