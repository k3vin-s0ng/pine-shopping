"use client";

interface ExampleChipProps {
  text: string;
  onClick: () => void;
}

export function ExampleChip({ text, onClick }: ExampleChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors whitespace-nowrap"
    >
      {text}
    </button>
  );
}
