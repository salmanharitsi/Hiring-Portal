"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type Props = {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  dataUrl?: string;
};

type DomicilesFile = {
  _metadata?: {
    generatedAt: string;
    totalDomiciles: number;
    source: string;
  };
  domiciles: string[];
};

const ITEMS_PER_PAGE = 20;

export default function DomicileSelect({
  value,
  onChange,
  placeholder = "Choose your domicile",
  dataUrl = "/data/domiciles.json",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hi, setHi] = useState(0);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(dataUrl, { cache: "force-cache" });
        const json = (await res.json()) as DomicilesFile;
        if (!alive) return;
        setItems(json.domiciles || []);
      } catch (err) {
        console.error("Failed to load domiciles:", err);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((s) => s.toLowerCase().includes(term));
  }, [items, q]);

  const displayedItems = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
    setHi(0);
  }, [q]);

  const loadMore = useCallback(() => {
    if (displayCount < filtered.length) {
      setDisplayCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filtered.length)
      );
    }
  }, [displayCount, filtered.length]);

  useEffect(() => {
    if (!open || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [open, loadMore]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    setHi((i) =>
      Math.min(Math.max(i, 0), Math.max(displayedItems.length - 1, 0))
    );
  }, [displayedItems.length]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.min(hi + 1, displayedItems.length - 1);
      setHi(nextIdx);
      listRef.current?.children?.[nextIdx]?.scrollIntoView({
        block: "nearest",
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = Math.max(hi - 1, 0);
      setHi(prevIdx);
      listRef.current?.children?.[prevIdx]?.scrollIntoView({
        block: "nearest",
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = displayedItems[hi];
      if (pick) {
        onChange(pick);
        setQ("");
        setOpen(false);
      }
    }
  }

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setQ("");
      setDisplayCount(ITEMS_PER_PAGE);
    }
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    setQ(opt);          
    setOpen(false);     
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className={[
          "flex items-center gap-2 h-10 w-full rounded-lg border px-3 cursor-pointer",
          "text-sm text-[#404040] bg-white transition-all",
          open ? "border-teal-500 ring-1 ring-teal-500" : "border-gray-300",
        ].join(" ")}
        onClick={handleToggle}
      >
        <input
          className="flex-1 outline-none placeholder:text-[#9E9E9E] cursor-text"
          placeholder={placeholder}
          value={open ? q : value ?? ""}
          onChange={(e) => {
            setQ(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        />
        <span
          className={[
            "text-gray-500 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
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
        </span>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-[0_12px_30px_rgba(16,24,40,.12)]">
          <div className="max-h-72 overflow-auto p-2" ref={listRef}>
            {loading ? (
              <div className="px-3 py-2 text-sm text-zinc-500">Loading…</div>
            ) : displayedItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                {q ? "No results found" : "No data available"}
              </div>
            ) : (
              <>
                {displayedItems.map((opt, idx) => (
                  <button
                    key={`${opt}-${idx}`}
                    onMouseEnter={() => setHi(idx)}
                    onClick={() => handleSelect(opt)}
                    className={[
                      "w-full text-left px-2 py-2 rounded-lg text-[13px] transition-colors text-gray-900",
                      hi === idx ? "bg-zinc-100" : "hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                ))}

                {/* Sentinel for infinite scroll */}
                {displayCount < filtered.length && (
                  <div ref={sentinelRef} className="h-1" />
                )}

                {/* Loading more indicator */}
                {displayCount < filtered.length && (
                  <div className="px-3 py-2 text-xs text-zinc-400 text-center">
                    Loading more...
                  </div>
                )}

                {/* Total shown */}
                {displayCount >= filtered.length &&
                  filtered.length > ITEMS_PER_PAGE && (
                    <div className="px-3 py-2 text-xs text-zinc-400 text-center">
                      Showing all {filtered.length} results
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
