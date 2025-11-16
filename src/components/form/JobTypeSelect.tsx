"use client";

import { useEffect, useRef, useState } from "react";

export type JobTypeOption = {
  value: string;
  label: string;
};

type Props = {
  value: string; // current selected value
  onChange: (v: string) => void;
  options: JobTypeOption[];
  placeholder?: string;
};

export default function JobTypeSelect({
  value,
  onChange,
  options,
  placeholder = "Select job type",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger (seperti input biasa) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full h-10 rounded-lg border border-zinc-300 bg-white",
          "px-4 pr-2 text-left text-sm text-[#404040]",
          "outline-none focus-visible:ring-1 focus-visible:ring-[#01959F] focus-visible:border-[#01959F]",
          "flex items-center justify-between",
        ].join(" ")}
      >
        <span
          className={
            selected ? "truncate" : "truncate text-zinc-400 select-none"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>

      {/* Options */}
      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-lg border border-zinc-200 bg-white shadow-md max-h-60 overflow-auto z-50">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={[
                  "w-full text-left px-4 py-2 text-sm font-semibold",
                  active
                    ? "bg-[#E6F7F8] text-[#01959F]"
                    : "text-[#404040] hover:bg-zinc-50",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-zinc-400">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
