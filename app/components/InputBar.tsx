"use client";

import { Search } from "lucide-react";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function InputBar({
  value,
  onChange,
  onSearch,
  placeholder = "e.g., quiet mechanical keyboard under $120, Prime",
  disabled = false,
}: InputBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled) {
      onSearch();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-14 px-4 md:px-6 pr-24 md:pr-32 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base"
      />
      <button
        onClick={onSearch}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 md:px-6 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm md:text-base"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </div>
  );
}
