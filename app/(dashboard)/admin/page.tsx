"use client";

import { useMemo, useState } from "react";
import SearchField from "@/src/components/form/SearchField";
import Image from "next/image";

type JobStatus = "active" | "inactive" | "draft";

type Job = {
  id: number;
  title: string;
  status: JobStatus;
  startedOn: string;
  salaryMin: string;
  salaryMax: string;
};

const JOBS: Job[] = [
  {
    id: 1,
    title: "Front End Developer",
    status: "active",
    startedOn: "started on 1 Oct 2025",
    salaryMin: "Rp7.000.000",
    salaryMax: "Rp8.000.000",
  },
  {
    id: 2,
    title: "Data Scientist",
    status: "inactive",
    startedOn: "started on 2 Oct 2025",
    salaryMin: "Rp7.000.000",
    salaryMax: "Rp12.500.000",
  },
  {
    id: 3,
    title: "Data Scientist",
    status: "draft",
    startedOn: "started on 3 Sep 2025",
    salaryMin: "Rp7.000.000",
    salaryMax: "Rp12.500.000",
  },
  {
    id: 4,
    title: "Backend Engineer",
    status: "active",
    startedOn: "started on 10 Sep 2025",
    salaryMin: "Rp8.000.000",
    salaryMax: "Rp11.000.000",
  },
  {
    id: 5,
    title: "Product Manager",
    status: "inactive",
    startedOn: "started on 18 Aug 2025",
    salaryMin: "Rp10.000.000",
    salaryMax: "Rp15.000.000",
  },
  {
    id: 6,
    title: "QA Engineer",
    status: "draft",
    startedOn: "started on 25 Jul 2025",
    salaryMin: "Rp6.000.000",
    salaryMax: "Rp9.000.000",
  },
  {
    id: 7,
    title: "UI/UX Designer",
    status: "active",
    startedOn: "started on 5 Jul 2025",
    salaryMin: "Rp7.500.000",
    salaryMax: "Rp10.000.000",
  },
];

const STATUS_STYLE: Record<
  JobStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  active: {
    label: "Active",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
    dotClass: "bg-emerald-500",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-red-50 text-red-600 border border-red-200/70",
    dotClass: "bg-red-500",
  },
  draft: {
    label: "Draft",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/70",
    dotClass: "bg-amber-400",
  },
};

export default function AdminPage() {
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return JOBS;
    return JOBS.filter((j) => j.title.toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="">
      <div className="mx-auto max-w-6xl">
        {/* Layout */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* LEFT: search + list */}
          <div className="flex-1">
            {/* Sticky search */}
            <div className="pb-5">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search by job details"
                className="w-full rounded-xl"
              />
            </div>

            {/* Scrollable job cards */}
            <div className="space-y-4 max-h-[calc(100vh-170px)] overflow-y-auto pr-1 pb-4">
              {filteredJobs.map((job) => {
                const styles = STATUS_STYLE[job.status];
                return (
                  <article
                    key={job.id}
                    className="rounded-2xl bg-white shadow-sm border border-zinc-100 px-5 py-4 sm:px-6 sm:py-5 flex flex-col gap-3"
                  >
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-sm px-3 py-1 font-semibold ${styles.badgeClass}`}
                      >
                        {styles.label}
                      </span>
                      <span className="inline-flex items-center rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600">
                        {job.startedOn}
                      </span>
                    </div>

                    {/* Title + salary + button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="mb-1 text-lg font-bold text-[#1D1F20]">
                          {job.title}
                        </h2>
                        <p className="text-sm text-zinc-500">
                          {job.salaryMin} - {job.salaryMax}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-[#01959F] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_4px_rgba(1,149,159,0.3)] hover:bg-[#017A83] transition-colors"
                      >
                        Manage Job
                      </button>
                    </div>
                  </article>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-6 py-8 text-center text-sm text-zinc-500">
                  No job found for{" "}
                  <span className="font-semibold">&ldquo;{query}&rdquo;</span>.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: sticky promo card */}
          <aside className="lg:w-[300px] shrink-0">
            <div className="sticky top-20">
              <div className="relative overflow-hidden rounded-2xl shadow-md">
                {/* Background image */}
                <Image
                  src="/images/bg-job-open.jpg"
                  alt="Recruit the best candidates"
                  fill
                  className="object-cover"
                  priority
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
                />

                {/* Content */}
                <div className="relative px-5 py-5 sm:py-6 flex flex-col gap-3 text-white">
                  <div>
                    <div className="text-lg font-semibold">
                      Recruit the best candidates
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      Create jobs, invite, and hire with ease.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 inline-flex items-center justify-center rounded-md bg-[#00A2B8] px-4 py-2 font-semibold text-white hover:bg-[#01889A] transition-colors"
                  >
                    Create a new job
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
