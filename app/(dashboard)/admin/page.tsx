"use client";

import { useEffect, useMemo, useState } from "react";
import SearchField from "@/src/components/form/SearchField";
import Image from "next/image";
import JobOpeningModal from "@/src/components/modals/JobOpeningModal";
import { toIDR, type JobStatus } from "@/src/data/jobs";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";

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

const PAGE_SIZE = 10;

type DbJob = {
  id: string;
  title: string;
  status: JobStatus;
  started_at: string | null;
  salary_min: number | null;
  salary_max: number | null;
};

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function loadJobs(reset = false) {
    if (loading) return; // cegah double request
    setLoading(true);

    try {
      const supabase = createClient();
      const trimmed = query.trim();
      const from = reset ? 0 : offset;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from("jobs")
        .select("id, title, status, started_at, salary_min, salary_max", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (trimmed) {
        q = q.ilike("title", `%${trimmed}%`);
      }

      const { data, error, count } = await q;

      if (error) {
        console.error("Failed to load jobs:", error);
        return;
      }

      const rows = (data ?? []) as DbJob[];

      setJobs((prev) => (reset ? rows : [...prev, ...rows]));

      const newOffset = from + rows.length;
      setOffset(newOffset);
      setHasMore((count ?? 0) > newOffset);
    } finally {
      setLoading(false);
    }
  }

  // load awal
  useEffect(() => {
    loadJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cari berdasarkan query (debounce dikit biar ga spam)
  useEffect(() => {
    const t = setTimeout(() => {
      loadJobs(true);
    }, 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const displayedJobs = useMemo(() => jobs, [jobs]);

  return (
    <main className="min-h-[calc(100vh-150px)]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="pb-5">
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search by job details"
                className="w-full rounded-xl"
              />
            </div>

            <div className="space-y-4 max-h-[calc(100vh-170px)] overflow-y-auto pr-1 pb-4">
              {displayedJobs.map((job) => {
                const styles = STATUS_STYLE[job.status];

                const salaryRange =
                  job.salary_min && job.salary_max
                    ? `${toIDR(job.salary_min)} - ${toIDR(job.salary_max)}`
                    : job.salary_min
                    ? toIDR(job.salary_min)
                    : job.salary_max
                    ? toIDR(job.salary_max)
                    : null;

                const startedOnLabel = job.started_at
                  ? new Date(job.started_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

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
                        {startedOnLabel}
                      </span>
                    </div>

                    {/* Title + salary + button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="mb-1 text-lg font-bold text-[#1D1F20]">
                          {job.title}
                        </h2>
                        {salaryRange && (
                          <p className="text-sm text-zinc-500">{salaryRange}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/manage-candidate/${job.id}`)
                        }
                        className="inline-flex items-center justify-center rounded-md bg-[#01959F] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_4px_rgba(1,149,159,0.3)] hover:bg-[#017A83] transition-colors"
                      >
                        Manage Job
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* State: tidak ada data */}
              {!loading &&
                displayedJobs.length === 0 &&
                (query.trim() ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-6 py-8 text-center text-sm text-zinc-500">
                    No job found for{" "}
                    <span className="font-semibold">&ldquo;{query}&rdquo;</span>
                    .
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 min-h-[calc(100vh-190px)]">
                    <div className="relative w-80 h-64 mb-6">
                      <Image
                        src="/images/vector-job.svg" 
                        alt="No job openings available"
                        fill
                        className="object-contain"
                      />
                    </div>

                    <h3 className="mb-2 text-base sm:text-xl font-bold text-[#1D1F20]">
                      No job openings available
                    </h3>

                    <p className="mb-4 max-w-md text-center text-zinc-500">
                      Create a job opening now and start the candidate process.
                    </p>

                    <button
                      type="button"
                      onClick={() => setOpenCreate(true)}
                      className="inline-flex items-center justify-center rounded-lg bg-[#F9A826] px-6 py-2.5 text-sm font-semibold text-[#1D1F20] shadow-[0_4px_10px_rgba(249,168,38,0.4)] hover:bg-[#F18F0A] transition-colors"
                    >
                      Create a new job
                    </button>
                  </div>
                ))}

              {/* Load more */}
              {hasMore && (
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => loadJobs(false)}
                    className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    {loading ? "Loading..." : "Load more jobs"}
                  </button>
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
                    onClick={() => setOpenCreate(true)}
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

      {/* Modal create job */}
      <JobOpeningModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </main>
  );
}
