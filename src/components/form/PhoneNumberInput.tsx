"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, Country, getFlagUrl } from "@/src/lib/phone/countries";
import SearchField from "./SearchField";
import Image from "next/image";

type Props = {
  value: string;                         
  onChange: (digits: string) => void;    
  country?: string;                      
  onCountryChange?: (c: Country) => void;
  className?: string;
};

export default function PhoneNumberInput({
  value,
  onChange,
  country = "ID",
  onCountryChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Country>(
    () => COUNTRIES.find((c) => c.iso2 === country) ?? COUNTRIES.find(c => c.iso2 === "ID")!
  );
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) {
      document.addEventListener("mousedown", handle);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.iso2.toLowerCase().includes(s) ||
        c.dial.includes(s.replace(/^\+/, ""))
    );
  }, [q]);

  function pick(c: Country) {
    setSelected(c);
    setOpen(false);
    onCountryChange?.(c);
  }

  function onDigitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, "");
    onChange(raw);
  }

  return (
    <div ref={ref} className={["relative", className].join(" ")}>
      <div className="flex">
        {/* tombol negara (kiri) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "inline-flex items-center gap-2 rounded-l-lg border border-r border-gray-300 bg-white px-3 h-10",
            "hover:bg-gray-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#01959F]",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {/* Bendera bulat dengan border */}
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200">
            <Image 
              src={getFlagUrl(selected.iso2)} 
              alt={selected.name}
              className="w-full h-full object-cover"
              width={15}
              height={15}
            />
          </div>
          <svg width="10" height="10" viewBox="0 0 12 12" className="text-zinc-500">
            <path fill="currentColor" d="M6 8 2 4h8z" />
          </svg>
        </button>

        {/* prefix kode negara */}
        <span className="inline-flex items-center border-y border-gray-300 pl-2 pr-1 h-10 text-sm text-[#404040]">
          {selected.dial}
        </span>

        {/* input digit */}
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={onDigitsChange}
          placeholder="81XXXXXXXXX"
          className="w-full h-10 rounded-r-lg border border-l-0 border-gray-300 pl-1 outline-none focus:border-[#01959F] focus:ring-1 focus:ring-[#01959F] text-sm placeholder:text-[#9E9E9E] text-[#404040]"
        />
      </div>

      {/* dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-[360px] max-w-[min(90vw,360px)] rounded-xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(16,24,40,.12)]"
          role="listbox"
        >
          <div className="p-4 border-b border-zinc-200">
            <SearchField value={q} onChange={setQ} placeholder="Search" autoFocus />
          </div>

          <ul className="max-h-72 overflow-auto py-1">
            {filtered.map((c) => {
              const active = c.iso2 === selected.iso2;
              return (
                <li key={c.iso2}>
                  <button
                    type="button"
                    onClick={() => pick(c)}
                    className={[
                      "w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-50",
                      active ? "bg-zinc-50" : "",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3 text-sm text-[#1D1F20]">
                      {/* Bendera bulat di dropdown */}
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                        <Image 
                          src={getFlagUrl(c.iso2)} 
                          alt={c.name}
                          className="w-full h-full object-cover"
                          width={15}
                          height={15}
                        />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </span>
                    <span className="text-sm text-zinc-500">{c.dial}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-zinc-500">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}