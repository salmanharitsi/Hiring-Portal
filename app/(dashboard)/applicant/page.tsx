"use client";

import ApplyFormModal from "@/src/components/modals/ApplyFormModal";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  toIDR,
  type WorkMode,
  type JobStatus,
  type Job,
} from "@/src/data/jobs";
import { createClient } from "@/src/lib/supabase/clients";

const badgeWorkMode = (m: WorkMode) => {
  switch (m) {
    case "Onsite":
      return "bg-orange-50 text-orange-800";
    case "Remote":
    case "Jarak Jauh":
      return "bg-sky-50 text-sky-800";
    case "Hybrid":
      return "bg-emerald-50 text-emerald-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

const badgeJobType = (jt: Job["jobType"]) => {
  switch (jt) {
    case "Internship":
      return "bg-cyan-50 text-cyan-800 font-bold";
    case "Contract":
      return "bg-fuchsia-50 text-fuchsia-800";
    case "Full-time":
      return "bg-lime-50 text-lime-800";
    case "Part-time":
      return "bg-amber-50 text-amber-800";
    case "Freelance":
      return "bg-violet-50 text-violet-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

const jobTypeLabel = (jt: Job["jobType"]) => {
  switch (jt) {
    case "Full-time":
      return "Penuh Waktu";
    case "Part-time":
      return "Paruh Waktu";
    case "Contract":
      return "Kontrak";
    case "Internship":
      return "Magang";
    case "Freelance":
      return "Freelance";
    default:
      return jt;
  }
};

// Hanya field yang dibutuhkan halaman ini
type ApplicantJob = {
  id: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  jobType: Job["jobType"];
  description: string[];
  company: string;
  companyLogo: string;
  companyLogoAlt: string;
  location: string;
  postedAt: string;
  workMode: WorkMode;
  level: string;
  tools?: string[];
  skills?: string[];
};

type DbJobRow = {
  id: string;
  title: string;
  status: JobStatus;
  salary_min: number | null;
  salary_max: number | null;
  job_type: Job["jobType"];
  description: string[] | null;
  company: string;
  company_logo: string | null;
  company_logo_alt: string | null;
  location: string;
  posted_at: string | null;
  work_mode: WorkMode;
  level: string;
  tools: string[] | null;
  skills: string[] | null;
};

type JobApplicationRow = {
  job_id: string;
};

function mapRowToApplicantJob(row: DbJobRow): ApplicantJob {
  return {
    id: row.id,
    title: row.title,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    jobType: row.job_type,
    description: row.description ?? [],
    company: row.company,
    companyLogo: row.company_logo ?? "/images/company-default.png",
    companyLogoAlt: row.company_logo_alt ?? row.company,
    location: row.location,
    postedAt: row.posted_at ?? "",
    workMode: row.work_mode,
    level: row.level,
    tools: row.tools ?? undefined,
    skills: row.skills ?? undefined,
  };
}

export default function ApplicantHomePage() {
  const [jobs, setJobs] = useState<ApplicantJob[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Load jobs dari DB, hanya status = active
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("jobs")
          .select(
            "id, title, status, salary_min, salary_max, job_type, description, company, company_logo, company_logo_alt, location, posted_at, work_mode, level, tools, skills"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load jobs for applicant:", error);
          setJobs([]);
          return;
        }

        const rows = (data ?? []) as DbJobRow[];
        const mapped = rows.map(mapRowToApplicantJob);
        setJobs(mapped);

        if (mapped.length > 0) {
          setActiveId(mapped[0].id);
        } else {
          setActiveId(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // Load daftar job yang sudah dilamar oleh user
  useEffect(() => {
    const loadApplied = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("job_applications")
          .select("job_id")
          .eq("user_id", user.id);

        if (error) {
          console.error("Failed to load applied jobs:", error);
          return;
        }

        const rows = (data ?? []) as JobApplicationRow[];
        const next = new Set(rows.map((row) => row.job_id));
        setAppliedJobIds(next);
      } catch (err) {
        console.error("Unexpected error when loading applied jobs:", err);
      }
    };

    void loadApplied();
  }, []);

  // callback ketika submit berhasil dari modal
  const handleApplied = (jobId: string) => {
    setAppliedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });
  };

  const activeJob = useMemo(
    () => (activeId ? jobs.find((j) => j.id === activeId) ?? null : null),
    [activeId, jobs]
  );

  const salaryRange =
    activeJob && activeJob.salaryMin && activeJob.salaryMax
      ? `${toIDR(activeJob.salaryMin)} - ${toIDR(activeJob.salaryMax)}`
      : activeJob && activeJob.salaryMin
      ? toIDR(activeJob.salaryMin)
      : activeJob && activeJob.salaryMax
      ? toIDR(activeJob.salaryMax)
      : undefined;

  // State: loading / kosong
  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading available jobs…
      </div>
    );
  }

  if (!loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center min-h-[calc(100vh-150px)]">
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
        <p className="max-w-md text-center text-zinc-500">
          Please wait for the next batch of openings.
        </p>
      </div>
    );
  }

  if (!activeJob) {
    return null;
  }

  const isApplied = appliedJobIds.has(activeJob.id);

  return (
    <div className="min-h-[calc(100vh-150px)]">
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 text-[#404040]">
        {/* LEFT LIST */}
        <aside className="space-y-5 max-h-[calc(60dvh-140px)] md:max-h-[calc(100dvh-140px)] overflow-auto pr-1">
          {jobs.map((job) => {
            const isActive = job.id === activeId;
            const listSalary =
              job.salaryMin && job.salaryMax
                ? `${toIDR(job.salaryMin)} - ${toIDR(job.salaryMax)}`
                : job.salaryMin
                ? toIDR(job.salaryMin)
                : job.salaryMax
                ? toIDR(job.salaryMax)
                : null;

            return (
              <button
                key={job.id}
                onClick={() => setActiveId(job.id)}
                className={[
                  "w-full text-left border shadow-sm rounded-lg p-4 transition shadow-sm/0 hover:shadow-sm",
                  isActive
                    ? "border-[#01777F] bg-[#F7FEFF] border-2"
                    : "border-zinc-200 bg-white hover:border-[#01777F]/50",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={job.companyLogo}
                    alt={job.companyLogoAlt}
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{job.title}</div>
                    <div className="text-xs text-zinc-500">{job.company}</div>
                    <span className="ml-auto text-zinc-400 text-[11px]">
                      {job.postedAt}
                    </span>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-zinc-600">
                        <Image
                          src="/icon/location-point.svg"
                          alt="Location Icon"
                          width={14}
                          height={14}
                        />
                        {job.location.split(" – ")[0]}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${badgeJobType(
                          job.jobType
                        )}`}
                      >
                        {jobTypeLabel(job.jobType)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${badgeWorkMode(
                          job.workMode
                        )}`}
                      >
                        {job.workMode}
                      </span>
                    </div>

                    {listSalary && (
                      <div className="inline-flex items-center gap-1 text-zinc-600 mt-2">
                        <Image
                          src="/icon/money.svg"
                          alt="Money Icon"
                          width={14}
                          height={14}
                        />
                        <div className="text-xs">{listSalary}</div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT DETAIL */}
        <section className="border border-zinc-200 rounded-lg p-6 bg-white">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-start gap-3">
              <Image
                src={activeJob.companyLogo}
                alt={activeJob.companyLogoAlt}
                width={36}
                height={36}
              />
              <div className="min-w-0">
                <div className="text-sm text-zinc-500">
                  {activeJob.company}
                </div>
                <h1 className="text-xl font-bold">{activeJob.title}</h1>
                <div className="text-sm text-zinc-500">
                  {activeJob.location} • {activeJob.workMode}
                </div>
              </div>
            </div>
            <div className="ml-auto w-full md:w-auto">
              <button
                className={[
                  "rounded-md px-4 py-1 font-bold w-full text-sm",
                  isApplied
                    ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                    : "bg-[#FBC037] text-[#1D1F20] shadow-md hover:brightness-95 cursor-pointer",
                ].join(" ")}
                onClick={() => {
                  if (!isApplied) setShowApply(true);
                }}
                type="button"
                disabled={isApplied}
              >
                {isApplied ? "Sudah dilamar" : "Apply"}
              </button>
            </div>
          </div>

          <hr className="my-5 border-zinc-200" />

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${badgeJobType(
                activeJob.jobType
              )}`}
            >
              {jobTypeLabel(activeJob.jobType)}
            </span>
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${badgeWorkMode(
                activeJob.workMode
              )}`}
            >
              {activeJob.level}
            </span>
          </div>

          {salaryRange && (
            <div className="mt-5 flex items-center gap-2 text-zinc-700">
              <Image
                src="/icon/money.svg"
                alt="Money Icon"
                width={17}
                height={17}
              />
              <span className="font-medium">{salaryRange}</span>
            </div>
          )}

          {(activeJob.tools?.length || activeJob.skills?.length) && (
            <>
              <h3 className="mt-6 font-bold">Alat</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeJob.tools?.map((t) => (
                  <span
                    key={t}
                    className="rounded-md font-semibold text-xs bg-sky-50 px-2 py-1 text-sky-800"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {activeJob.skills && activeJob.skills.length > 0 && (
                <>
                  <h3 className="mt-6 font-bold">Kompetensi</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeJob.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md font-semibold bg-amber-50 px-2 py-1 text-xs text-amber-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <h3 className="mt-6 font-bold">Deskripsi</h3>
          <div className="mt-2 space-y-3 text-sm text-zinc-700">
            {activeJob.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>

      <ApplyFormModal
        open={showApply}
        onClose={() => setShowApply(false)}
        jobId={activeJob.id}
        jobTitle={activeJob.title}
        company={activeJob.company}
        onApplied={handleApplied}
      />
    </div>
  );
}
