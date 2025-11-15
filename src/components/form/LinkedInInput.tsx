import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";

type Props = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

type ValidationStatus = "idle" | "checking" | "valid" | "invalid" | "not-found";

export default function LinkedInInput({ value, onChange, required }: Props) {
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isValidFormat = useMemo(() => {
    if (!value.trim()) return false;
    const regex =
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9._%-]+\/?$/i;
    return regex.test(value.trim());
  }, [value]);

  const checkLinkedInExists = useCallback(async () => {
    if (!isValidFormat || !value.trim()) return;

    setValidationStatus("checking");
    setErrorMessage("");

    try {
      const response = await fetch("/api/check-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.trim() }),
      });

      const data = await response.json();

      if (data.exists) {
        setValidationStatus("valid");
      } else {
        setValidationStatus("not-found");
        setErrorMessage("Akun LinkedIn tidak ditemukan");
      }
    } catch (error) {
      setValidationStatus("invalid");
      setErrorMessage("Gagal memvalidasi URL");
    }
  }, [isValidFormat, value]);

  useEffect(() => {
    if (!value.trim()) return;
    if (!isValidFormat) return;

    const timer = setTimeout(() => {
      checkLinkedInExists();
    }, 800);

    return () => clearTimeout(timer);
  }, [value, isValidFormat, checkLinkedInExists]);

  const displayStatus: ValidationStatus = useMemo(() => {
    if (!value.trim()) return "idle";
    if (!isValidFormat) return "invalid";
    return validationStatus;
  }, [value, isValidFormat, validationStatus]);

  const displayError = useMemo(() => {
    if (!value.trim()) return "";
    if (!isValidFormat) return "Format URL LinkedIn tidak valid";
    if (validationStatus === "not-found")
      return "Akun LinkedIn tidak ditemukan";
    if (validationStatus === "invalid")
      return errorMessage || "Gagal memvalidasi URL";
    return "";
  }, [value, isValidFormat, validationStatus, errorMessage]);

  return (
    <div>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://www.linkedin.com/in/username"
          className="w-full h-10 rounded-lg border border-gray-300 px-4 pr-16 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-[#9E9E9E] text-[#404040]"
        />

        <div className="absolute right-3 top-[22px] -translate-y-1/2 flex items-center gap-2">
          {/* Loading spinner */}
          {displayStatus === "checking" && (
            <div className="animate-spin h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full" />
          )}

          {/* Tooltip icon */}
          <div className="relative group">
            <button
              type="button"
              className="text-amber-500 hover:text-amber-600"
              aria-label="Info bantuan LinkedIn"
            >
              {/* icon circle alert / info */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>

            {/* Tooltip content */}
            <div className="pointer-events-none absolute right-0 top-full mt-1 w-64 rounded-md bg-black/80 px-3 py-2 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Jika tautan LinkedIn kamu belum terdeteksi, coba ketik ulang
              beberapa karakter terakhir URL-nya.
            </div>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {value && displayStatus !== "idle" && displayStatus !== "checking" && (
        <div className="mt-2">
          {displayStatus === "valid" && (
            <div className="text-xs inline-flex items-center gap-2 text-emerald-600">
              <span className="inline-grid place-items-center h-4 w-4 rounded-full border border-emerald-600 bg-emerald-50">
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  className="stroke-emerald-600"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-medium">URL address found</span>
            </div>
          )}

          {(displayStatus === "not-found" || displayStatus === "invalid") && (
            <div className="text-xs inline-flex items-center gap-2 text-red-600">
              <span className="inline-grid place-items-center h-4 w-4 rounded-full border border-red-600 bg-red-50">
                <svg
                  width="2"
                  height="10"
                  viewBox="0 0 2 10"
                  fill="none"
                  className="fill-red-600"
                >
                  <path d="M1 0C0.447715 0 0 0.447715 0 1V6C0 6.55228 0.447715 7 1 7C1.55228 7 2 6.55228 2 6V1C2 0.447715 1.55228 0 1 0Z" />
                  <circle cx="1" cy="8.5" r="1" />
                </svg>
              </span>
              <span className="font-medium">{displayError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
