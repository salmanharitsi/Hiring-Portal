"use client";

import Image from "next/image";

export default function Footer({
  companyName = "PT. Rakamin Kolektif Madani",
  addressLines = [
    "Menara Caraka - Jl. Mega Kuningan Barat,",
    "Kuningan, Kecamatan Setiabudi, Jakarta Selatan,",
    "DKI Jakarta 12950",
  ],
  year = 2025,
  version = "V.0001",
  logoSrc = "/logo/logo-rakamin.svg",
}: {
  companyName?: string;
  addressLines?: string[];
  year?: number;
  version?: string;
  logoSrc?: string;
}) {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-8">
          {/* Left: address */}
          <div className="text-sm">
            <p className="font-semibold text-zinc-800">{companyName}</p>
            <div className="mt-3 space-y-1 text-zinc-600">
              {addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span>© Rakamin Career Solution {year}. All rights reserved</span>
              <span>{version}</span>
            </div>
          </div>

          {/* Right: logo */}
          <div className="shrink-0">
            <Image
              src={logoSrc}
              alt="Rakamin Logo"
              width={175}
              height={50}
              className="opacity-90"
              priority
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
