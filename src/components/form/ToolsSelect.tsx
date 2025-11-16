"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ToolOption = {
  id: string;
  name: string;
};

type ToolsSelectProps = {
  value: string[]; // list nama tools terpilih
  onChange: (next: string[]) => void;
  label?: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export default function ToolsSelect({
  value,
  onChange,
  label,
}: ToolsSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ToolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ====== Fetch tools dari API ======

  async function fetchTools(search: string): Promise<void> {
    try {
      setLoading(true);
      const params = search.trim().length
        ? `?q=${encodeURIComponent(search.trim())}`
        : "";
      const res = await fetch(`/api/tools${params}`);
      if (!res.ok) return;
      const json = (await res.json()) as { tools: ToolOption[] };
      setOptions(json.tools);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void fetchTools(query);
  }, [open, query]);

  // Fetch awal saat mount (supaya dropdown tidak kosong)
  useEffect(() => {
    void fetchTools("");
  }, []);

  // ====== Click outside untuk tutup dropdown ======
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ====== Helpers ======
  const selectedNormalized = useMemo(
    () => value.map((v) => normalizeName(v)),
    [value]
  );

  const filteredOptions = useMemo(() => {
    const q = normalizeName(query);
    if (!q) return options;
    return options.filter((opt) => normalizeName(opt.name).includes(q));
  }, [options, query]);

  function isSelected(name: string): boolean {
    const n = normalizeName(name);
    return selectedNormalized.includes(n);
  }

  function handleSelectOption(option: ToolOption): void {
    if (isSelected(option.name)) return;
    onChange([...value, option.name]);
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function handleRemoveTool(toolName: string): void {
    const n = normalizeName(toolName);
    const next = value.filter((t) => normalizeName(t) !== n);
    onChange(next);
  }

  const canShowAddNew = useMemo(() => {
    const q = query.trim();
    if (!q) return false;
    const normalized = normalizeName(q);

    const existsInOptions = options.some(
      (opt) => normalizeName(opt.name) === normalized
    );
    const existsInSelected = value.some(
      (val) => normalizeName(val) === normalized
    );

    return !existsInOptions && !existsInSelected;
  }, [query, options, value]);

  async function handleAddNewTool(): Promise<void> {
    const raw = query.trim();
    if (!raw) return;

    try {
      setCreating(true);
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: raw }),
      });

      if (!res.ok) {
        // optional: bisa pakai toast di sini jika mau
        return;
      }

      const json = (await res.json()) as { tool: ToolOption };
      const newTool = json.tool;

      setOptions((prev) => {
        const exists = prev.some(
          (opt) => normalizeName(opt.name) === normalizeName(newTool.name)
        );
        if (exists) return prev;
        return [...prev, newTool].sort((a, b) => a.name.localeCompare(b.name));
      });

      if (!isSelected(newTool.name)) {
        onChange([...value, newTool.name]);
      }

      setQuery("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full text-xs text-[#404040]">
      {label && <label className="mb-1 block font-medium">{label}</label>}

      <div ref={containerRef} className="relative">
        {/* Input/chip area - GANTI dari button ke div */}
        <div
          onClick={() => {
            setOpen(true);
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
          className="w-full min-h-10 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-left flex flex-wrap items-center gap-1 focus-within:border-[#01959F] focus-within:ring-1 focus-within:ring-[#01959F] cursor-text"
        >
          {value.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-800 px-2 py-0.5 text-[11px] font-semibold border border-sky-100"
            >
              {tool}
              {/* GANTI ke span dengan onClick, bukan button */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTool(tool);
                }}
                className="text-[10px] text-sky-700 hover:text-sky-900 cursor-pointer"
                aria-label={`Remove ${tool}`}
                role="button"
              >
                ×
              </span>
            </span>
          ))}

          {/* Search input - HAPUS placeholder di sini */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent border-none outline-none px-1 py-1 min-w-[60px] placeholder:text-sm text-sm"
            placeholder="Add tools (e.g. React, Figma, Next.js)"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-md text-xs max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-zinc-400">Loading tools...</div>
            )}

            {!loading &&
              filteredOptions
                .filter((opt) => !isSelected(opt.name))
                .map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 text-[#404040] text-sm font-semibold"
                  >
                    {opt.name}
                  </button>
                ))}

            {!loading && filteredOptions.length === 0 && !canShowAddNew && (
              <div className="px-3 py-2 text-zinc-400">No tools found.</div>
            )}

            {canShowAddNew && (
              <button
                type="button"
                onClick={handleAddNewTool}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-[#01959F] hover:bg-[#E6F7F8] font-semibold border-t border-zinc-100 disabled:text-zinc-400 disabled:hover:bg-transparent"
              >
                {creating ? "Adding..." : `+ Add "${query.trim()}" as new tool`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
