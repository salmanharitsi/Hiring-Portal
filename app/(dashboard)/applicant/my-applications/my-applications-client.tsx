"use client";

import { useState } from "react";
import Image from "next/image";
import type { MyApplication, ApplicationStatus } from "./page";
import ApplicationDetailModal from "@/src/components/modals/ApplicationDetailModal";

type Props = {
  applications: MyApplication[];
};

const statusBadgeClass = (st: ApplicationStatus) => {
  switch (st) {
    case "menunggu":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "diterima":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "ditolak":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 border border-zinc-200";
  }
};

export default function MyApplicationsClient({ applications }: Props) {
  const [selected, setSelected] = useState<MyApplication | null>(null);

  if (applications.length === 0) {
    return (
      <div className="space-y-4 min-h-[calc(100vh-150px)]">
        <h1 className="text-lg font-bold text-[#1D1F20]">
          My Applications
        </h1>
        <div className="border border-zinc-200 rounded-2xl p-6 text-sm text-zinc-600 bg-white flex flex-col items-center text-center">
          <div className="relative w-64 h-40 mb-4">
            <Image
              src="/images/vector-candidate.svg"
              alt="No applications yet"
              fill
              className="object-contain"
            />
          </div>
          <p className="font-semibold mb-1">
            Belum ada aplikasi yang diajukan.
          </p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Lamar salah satu lowongan yang tersedia, nanti aplikasi kamu akan
            muncul di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 min-h-[calc(100vh-150px)]">
        <h1 className="text-lg font-semibold text-[#1D1F20]">
          My Applications
        </h1>

        <div className="grid gap-4">
          {applications.map((app) => {
            const created = new Date(app.createdAt);
            const createdLabel = created.toLocaleString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <article
                key={app.id}
                className="rounded-2xl border border-zinc-200 bg-white shadow-sm px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                {/* LEFT: logo + job info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-10 w-10 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0">
                    <Image
                      src={app.job.companyLogo ?? "/images/company-default.png"}
                      alt={app.job.companyLogoAlt ?? app.job.company}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500">
                      {app.job.company}
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-[#1D1F20] truncate">
                      {app.job.title}
                    </h2>
                    <div className="text-xs text-zinc-500">
                      {app.job.location} • {app.job.workMode}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                        {app.job.jobType}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800">
                        {app.job.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: status + time + button */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Diajukan pada {createdLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(app)}
                    className="mt-1 inline-flex items-center justify-center rounded-md border border-zinc-200 px-3 py-1 text-xs font-semibold text-[#01959F] hover:bg-zinc-50"
                  >
                    Lihat detail
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <ApplicationDetailModal
        open={selected !== null}
        application={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
