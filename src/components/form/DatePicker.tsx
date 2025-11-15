"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addMonths, addYears, clamp, format } from "date-fns";
import { enGB } from "date-fns/locale";

type Props = {
  value?: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select your date of birth",
  fromYear = 1960,
  toYear = new Date().getFullYear(),
}: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  const minDate = new Date(fromYear, 0, 1);
  const maxDate = new Date(toYear, 11, 31);

  useEffect(() => {
    if (value) setMonth(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const display = useMemo(
    () => (value ? format(value, "dd MMMM yyyy", { locale: enGB }) : ""),
    [value]
  );

  const canPrevMonth =
    addMonths(month, -1) >=
    new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canNextMonth =
    addMonths(month, 1) <=
    new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const safeSetMonth = (m: Date) => {
    const minM = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const maxM = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    const clamped = clamp(m, { start: minM, end: maxM });
    setMonth(clamped);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 rounded-lg border border-gray-300 px-3 pr-10 text-left text-sm placeholder:text-[#9E9E9E] text-[#404040] hover:border-teal-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className={`flex items-center gap-2 ${
            display ? "" : "text-[#9E9E9E]"
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-[#1D1F20]"
          >
            <path d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v1h20V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1zM22 9H2v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9z" />
          </svg>
          {display || placeholder}
        </span>
        <span
          className={[
            "text-gray-500 transition-transform duration-200 absolute right-3 top-1/2 -translate-y-1/2",
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
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          className="absolute z-50 mt-2 rounded-xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(16,24,40,.12)] text-gray-900"
        >
          {/* Header custom: panah kiri/kanan + label center */}
          <div className="relative px-3 pt-3 text-gray-900">
            <div className="absolute left-3 top-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  canPrevMonth && safeSetMonth(addYears(month, -1))
                }
                disabled={!canPrevMonth}
                className={`h-7 w-7 grid place-items-center rounded-lg text-xl ${
                  canPrevMonth
                    ? "hover:bg-zinc-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Previous year"
              >
                «
              </button>
              <button
                type="button"
                onClick={() =>
                  canPrevMonth && safeSetMonth(addMonths(month, -1))
                }
                disabled={!canPrevMonth}
                className={`h-7 w-7 grid place-items-center rounded-lg text-xl ${
                  canPrevMonth
                    ? "hover:bg-zinc-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Previous month"
              >
                ‹
              </button>
            </div>

            <div className="text-center mt-1.5">
              <span className="text-[15px] font-semibold">
                {format(month, "MMMM yyyy", { locale: enGB })}
              </span>
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  canNextMonth && safeSetMonth(addMonths(month, 1))
                }
                disabled={!canNextMonth}
                className={`h-7 w-7 grid place-items-center rounded-lg text-xl ${
                  canNextMonth
                    ? "hover:bg-zinc-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Next month"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => canNextMonth && safeSetMonth(addYears(month, 1))}
                disabled={!canNextMonth}
                className={`h-7 w-7 grid place-items-center rounded-lg text-xl ${
                  canNextMonth
                    ? "hover:bg-zinc-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Next year"
              >
                »
              </button>
            </div>
          </div>

          <DayPicker
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={value ?? undefined}
            onSelect={(d) => {
              onChange(d ?? null);
              if (d) setOpen(false);
            }}
            locale={enGB}
            weekStartsOn={0}
            fromYear={fromYear}
            toYear={toYear}
            showOutsideDays
            className="rdp rdp--no-caption"
            classNames={{
              root: "p-3 text-gray-900",
              table: "rdp-table mx-2 my-2",
              head_cell:
                "w-9 h-8 text-center text-[12px] font-medium text-gray-900",
              row: "rdp-row",
              cell: "rdp-cell p-0.5 text-center",
              day: "place-items-center h-10 w-10 rounded-full text-sm hover:bg-zinc-100 focus:outline-none text-gray-900",
              day_outside: "text-zinc-300",
              day_selected:
                "ring-2 ring-[#FBC037] ring-offset-2 ring-offset-white bg-white text-gray-900 hover:bg-white",
              day_today:
                "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-[#FBC037]",
              nav: "hidden",
            }}
            formatters={{
              formatWeekdayName: (d) => format(d, "EEEEE", { locale: enGB }),
            }}
            styles={{
              caption: { display: "none" },
            }}
          />
        </div>
      )}
    </div>
  );
}
