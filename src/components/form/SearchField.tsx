"use client";
import { useId } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export default function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  autoFocus,
}: Props) {
  const id = useId();
  return (
    <div
      className={[
        "flex items-center gap-2 rounded-lg border-2 border-zinc-200 bg-white px-3 h-10",
        className,
      ].join(" ")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" className="text-zinc-500">
        <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l4.39 4.39-1.42 1.42-4.39-4.39A8 8 0 1 1 10 2m0 2a6 6 0 1 0 0 12A6 6 0 0 0 10 4Z" />
      </svg>
      <input
        id={id}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 outline-none text-sm text-[#404040] placeholder:text-zinc-400"
      />
    </div>
  );
}
