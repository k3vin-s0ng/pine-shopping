"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  onRetry: () => void;
  onEditQuery: () => void;
}

export function ErrorState({ onRetry, onEditQuery }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-center">We couldn't reach Amazon right now</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Try again, or refine your query.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="px-6 h-12 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onEditQuery}
          className="px-6 h-12 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          Edit query
        </button>
      </div>
    </div>
  );
}
