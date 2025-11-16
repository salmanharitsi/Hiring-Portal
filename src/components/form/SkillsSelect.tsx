"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SkillOption = {
  id: string;
  name: string;
};

type SkillsSelectProps = {
  value: string[]; // list nama skills terpilih
  onChange: (next: string[]) => void;
  label?: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export default function SkillsSelect({
  value,
  onChange,
  label,
}: SkillsSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ====== Fetch skills dari API ======

  async function fetchSkills(search: string): Promise<void> {
    try {
      setLoading(true);
      const params = search.trim().length
        ? `?q=${encodeURIComponent(search.trim())}`
        : "";
      const res = await fetch(`/api/skills${params}`);
      if (!res.ok) return;
      const json = (await res.json()) as { skills: SkillOption[] };
      setOptions(json.skills);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void fetchSkills(query);
  }, [open, query]);

  // Fetch awal saat mount (supaya dropdown tidak kosong)
  useEffect(() => {
    void fetchSkills("");
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

  function handleSelectOption(option: SkillOption): void {
    if (isSelected(option.name)) return;
    onChange([...value, option.name]);
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function handleRemoveSkill(skillName: string): void {
    const n = normalizeName(skillName);
    const next = value.filter((s) => normalizeName(s) !== n);
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

  async function handleAddNewSkill(): Promise<void> {
    const raw = query.trim();
    if (!raw) return;

    try {
      setCreating(true);
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: raw }),
      });

      if (!res.ok) {
        // optional: bisa pakai toast di sini kalau mau
        return;
      }

      const json = (await res.json()) as { skill: SkillOption };
      const newSkill = json.skill;

      setOptions((prev) => {
        const exists = prev.some(
          (opt) => normalizeName(opt.name) === normalizeName(newSkill.name)
        );
        if (exists) return prev;
        return [...prev, newSkill].sort((a, b) => a.name.localeCompare(b.name));
      });

      if (!isSelected(newSkill.name)) {
        onChange([...value, newSkill.name]);
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
        {/* Input/chip area */}
        <div
          onClick={() => {
            setOpen(true);
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
          className="w-full min-h-10 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-left flex flex-wrap items-center gap-1 focus-within:border-[#01959F] focus-within:ring-1 focus-within:ring-[#01959F] cursor-text"
        >
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[11px] font-semibold border border-amber-100"
            >
              {skill}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSkill(skill);
                }}
                className="text-[10px] text-amber-700 hover:text-amber-900 cursor-pointer"
                aria-label={`Remove ${skill}`}
                role="button"
              >
                ×
              </span>
            </span>
          ))}

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent border-none outline-none px-1 py-1 min-w-[60px] placeholder:text-sm text-sm"
            placeholder="Add skills (e.g. React, SQL, Communication)"
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-md text-xs max-h-52 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-zinc-400">Loading skills...</div>
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
              <div className="px-3 py-2 text-zinc-400">No skills found.</div>
            )}

            {canShowAddNew && (
              <button
                type="button"
                onClick={handleAddNewSkill}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-[#01959F] hover:bg-[#E6F7F8] font-semibold border-t border-zinc-100 disabled:text-zinc-400 disabled:hover:bg-transparent"
              >
                {creating
                  ? "Adding..."
                  : `+ Add "${query.trim()}" as new skill`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
