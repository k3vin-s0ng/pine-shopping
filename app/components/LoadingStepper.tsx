"use client";

import { Check, Loader2 } from "lucide-react";

interface LoadingStepperProps {
  currentStep: number;
}

const steps = [
  "Understanding your request…",
  "Searching Amazon…",
  "Comparing best matches…",
];

export function LoadingStepper({ currentStep }: LoadingStepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={index} className="flex items-center gap-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <Check className="w-4 h-4" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span
              className={`transition-colors ${
                isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
