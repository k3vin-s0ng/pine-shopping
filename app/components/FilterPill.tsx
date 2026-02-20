"use client";

import { X } from "lucide-react";

interface FilterPillProps {
  text: string;
  onRemove?: () => void;
}

export function FilterPill({ text, onRemove }: FilterPillProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20">
      <span>{text}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
