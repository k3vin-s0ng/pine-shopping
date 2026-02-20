"use client";

import { Search } from "lucide-react";

interface EmptyStateProps {
  onRelaxConstraint: (constraint: string) => void;
  relaxOptions: string[];
}

export function EmptyState({ onRelaxConstraint, relaxOptions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-center">No strong matches found</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Here are the closest 3, plus ways to broaden your search.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {relaxOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => onRelaxConstraint(option)}
            className="px-4 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
