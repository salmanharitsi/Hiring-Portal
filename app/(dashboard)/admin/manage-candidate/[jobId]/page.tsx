"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type JobStatus,
  type ProfileRequirementStatus,
} from "@/src/data/jobs";
import { createClient } from "@/src/lib/supabase/clients";
import Image from "next/image";
import { toast } from "sonner";

type ApplicationStatus = "menunggu" | "diterima" | "ditolak";

type Applicant = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  domicile: string;
  gender: "Male" | "Female";
  linkedin: string;
  createdAt: string;
  status: ApplicationStatus;
};

type DbJob = {
  id: string;
  title: string;
  status: JobStatus;

  // profile requirements per field
  profile_full_name: ProfileRequirementStatus | null;
  profile_photo: ProfileRequirementStatus | null;
  profile_gender: ProfileRequirementStatus | null;
  profile_domicile: ProfileRequirementStatus | null;
  profile_email: ProfileRequirementStatus | null;
  profile_phone: ProfileRequirementStatus | null;
  profile_linkedin: ProfileRequirementStatus | null;
  profile_dob: ProfileRequirementStatus | null;
};

type DbApplicationRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  domicile: string | null;
  gender: string | null;
  linkedin: string | null;
  created_at: string;
  status: string | null;
};

const PAGE_SIZE = 10;

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

export default function ManageCandidatePage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState<DbJob | null>(null);
  const [status, setStatus] = useState<JobStatus>("inactive");
  const [loadingJob, setLoadingJob] = useState(true);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(true);

  const [page, setPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ====== LOAD JOB (termasuk profile requirements) ======
  useEffect(() => {
    const loadJob = async () => {
      setLoadingJob(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("jobs")
          .select(
            [
              "id",
              "title",
              "status",
              "profile_full_name",
              "profile_photo",
              "profile_gender",
              "profile_domicile",
              "profile_email",
              "profile_phone",
              "profile_linkedin",
              "profile_dob",
            ].join(", ")
          )
          .eq("id", jobId)
          .single();

        if (error || !data) {
          console.error("Failed to load job:", error);
          setJob(null);
          return;
        }

        const j = data as unknown as DbJob;
        setJob(j);
        setStatus(j.status);
      } finally {
        setLoadingJob(false);
      }
    };

    loadJob();
  }, [jobId]);

  // ====== LOAD APPLICANTS ======
  useEffect(() => {
    const loadApplicants = async () => {
      setLoadingApplicants(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("job_applications")
          .select(
            "id, job_id, full_name, email, phone, dob, domicile, gender, linkedin, created_at, status"
          )
          .eq("job_id", jobId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load applicants:", error);
          setApplicants([]);
          return;
        }

        const rows = (data ?? []) as DbApplicationRow[];

        const mapped: Applicant[] = rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone ?? "-",
          dob: row.dob ?? "-",
          domicile: row.domicile ?? "-",
          gender: (row.gender as "Male" | "Female") ?? "Male",
          linkedin: row.linkedin ?? "",
          createdAt: row.created_at,
          status: (row.status as ApplicationStatus) ?? "menunggu",
        }));

        setApplicants(mapped);
        setPage(1);
        setSelectAll(false);
        setSelected(new Set());
      } finally {
        setLoadingApplicants(false);
      }
    };

    loadApplicants();
  }, [jobId]);

  // ====== PROFILE REQUIREMENT → VISIBILITY KOLUMN ======
  const showFullName = job?.profile_full_name !== "off";
  const showEmail = job?.profile_email !== "off";
  const showPhone = job?.profile_phone !== "off";
  const showDob = job?.profile_dob !== "off";
  const showDomicile = job?.profile_domicile !== "off";
  const showGender = job?.profile_gender !== "off";
  const showLinkedin = job?.profile_linkedin !== "off";

  const totalColumns =
    1 + // checkbox
    (showFullName ? 1 : 0) +
    (showEmail ? 1 : 0) +
    (showPhone ? 1 : 0) +
    (showDob ? 1 : 0) +
    (showDomicile ? 1 : 0) +
    (showGender ? 1 : 0) +
    1 + // status
    (showLinkedin ? 1 : 0);

  // ====== PAGINATION ======
  const total = applicants.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const currentRows = useMemo(
    () => applicants.slice(startIdx, endIdx),
    [applicants, startIdx, endIdx]
  );

  // ====== JOB STATUS TOGGLE ======
  const toggleStatus = async (newStatus: JobStatus) => {
    if (!jobId || newStatus === status) return;

    const prev = status;
    setStatus(newStatus); // optimistic UI

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) {
        console.error("Failed to update job status:", error);
        setStatus(prev);
        toast.error("Gagal mengubah status job. Silakan coba lagi.");
        return;
      }

      toast.success(
        newStatus === "active"
          ? "Job berhasil diubah menjadi Active."
          : "Job berhasil diubah menjadi Inactive."
      );
    } catch (e) {
      console.error("Unexpected error updating job status:", e);
      setStatus(prev);
      toast.error("Terjadi kesalahan tak terduga saat mengubah status job.");
    }
  };

  // ====== SELECTION ======
  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectAll(false);
      setSelected(new Set());
    } else {
      setSelectAll(true);
      setSelected(new Set(currentRows.map((a) => a.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (selected.size === 0) return;

    setUpdatingStatus(true);
    try {
      const ids = Array.from(selected);

      const res = await fetch("/api/job-applications/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, status: newStatus }),
      });

      if (!res.ok) {
        console.error("Failed to update application status:", await res.text());
        return;
      }

      setApplicants((prev) =>
        prev.map((app) =>
          ids.includes(app.id) ? { ...app, status: newStatus } : app
        )
      );
      setSelected(new Set());
      setSelectAll(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ====== STATE: JOB NOT FOUND / LOADING ======
  if (!loadingJob && !job) {
    return (
      <main className="mx-auto max-w-6xl py-6">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-[#01959F] hover:underline"
        >
          ← Back to Job list
        </button>
        <p className="mt-4 text-sm text-zinc-700">Job not found.</p>
      </main>
    );
  }

  if (loadingJob || !job) {
    return (
      <main className="mx-auto max-w-6xl py-6 text-sm text-zinc-500">
        Loading job detail…
      </main>
    );
  }

  // ====== RENDER ======
  return (
    <main className="mx-auto max-w-6xl text-[#1D1F20] py-6 min-h-[calc(100vh-150px)]">
      {/* Breadcrumb */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin"
          className="inline-flex items-center font-bold rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
        >
          Job list
        </Link>
        <span className="text-lg text-zinc-800">›</span>
        <span className="inline-flex items-center font-bold rounded-md border border-zinc-200 bg-slate-100 px-3 py-1 text-xs text-zinc-700">
          Manage Candidate
        </span>
      </div>

      {/* Title + status toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">{job.title}</h1>

        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
          <span className="uppercase tracking-wide">Job Status</span>
          <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={() => toggleStatus("active")}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold",
                status === "active"
                  ? "bg-[#01959F] text-white shadow"
                  : "text-zinc-600 hover:bg-white",
              ].join(" ")}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => toggleStatus("inactive")}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold",
                status === "inactive"
                  ? "bg-red-500 text-white shadow"
                  : "text-zinc-600 hover:bg-white",
              ].join(" ")}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Card with table */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-700">
            <span>{selected.size} candidate selected</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleBulkUpdateStatus("diterima")}
                className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 font-semibold text-white text-xs hover:bg-emerald-600 disabled:opacity-60"
              >
                {updatingStatus ? "Updating..." : "Terima"}
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleBulkUpdateStatus("ditolak")}
                className="inline-flex items-center rounded-md bg-red-500 px-3 py-1 font-semibold text-white text-xs hover:bg-red-600 disabled:opacity-60"
              >
                {updatingStatus ? "Updating..." : "Tolak"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl!">
          <table className="min-w-full text-sm rounded-2xl!">
            <thead className="bg-[#F9FAFB] rounded-t-2xl border-b border-zinc-200">
              <tr className="text-xs font-bold uppercase text-zinc-900 whitespace-nowrap">
                <th className="w-10 p-4 text-left rounded-2xl!">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#01959F]"
                    checked={selectAll}
                    onChange={handleToggleSelectAll}
                  />
                </th>

                {showFullName && (
                  <th className="p-4 text-left">Nama Lengkap</th>
                )}
                {showEmail && <th className="p-4 text-left">Email Address</th>}
                {showPhone && <th className="p-4 text-left">Phone Numbers</th>}
                {showDob && <th className="p-4 text-left">Date of Birth</th>}
                {showDomicile && <th className="p-4 text-left">Domicile</th>}
                {showGender && <th className="p-4 text-left">Gender</th>}

                <th className="p-4 text-left">Status</th>

                {showLinkedin && (
                  <th className="p-4 text-left rounded-2xl!">Link LinkedIn</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loadingApplicants ? (
                <tr>
                  <td
                    colSpan={totalColumns}
                    className="px-4 py-6 text-center text-sm text-zinc-500"
                  >
                    Loading applicants…
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-zinc-500"
                    colSpan={totalColumns}
                  >
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative w-[276px] h-[260px] mb-6">
                        <Image
                          src="/images/vector-candidate.svg"
                          alt="No candidates yet"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <h3 className="mb-2 text-base sm:text-xl font-bold text-[#1D1F20]">
                        No candidates found
                      </h3>
                      <p className="max-w-md text-center text-zinc-500">
                        Share your job vacancies so that more candidates will
                        apply.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 1 ? "bg-white" : "bg-[#FCFEFF]"}
                  >
                    <td className="px-4 py-3 align-middle">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#01959F]"
                        checked={selected.has(row.id)}
                        onChange={() => handleToggleRow(row.id)}
                      />
                    </td>

                    {showFullName && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-800">
                        {row.fullName}
                      </td>
                    )}
                    {showEmail && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-600">
                        {row.email}
                      </td>
                    )}
                    {showPhone && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-700">
                        {row.phone}
                      </td>
                    )}
                    {showDob && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-700 whitespace-nowrap">
                        {row.dob}
                      </td>
                    )}
                    {showDomicile && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-700">
                        {row.domicile}
                      </td>
                    )}
                    {showGender && (
                      <td className="px-4 py-3 align-middle text-sm text-zinc-700">
                        {row.gender}
                      </td>
                    )}

                    <td className="px-4 py-3 align-middle text-sm text-zinc-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {showLinkedin && (
                      <td className="px-4 py-3 align-middle text-sm">
                        {row.linkedin ? (
                          <a
                            href={row.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-[130px] truncate text-[#01959F] hover:underline inline-block"
                          >
                            {row.linkedin}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing{" "}
            <span className="font-semibold">
              {total === 0 ? 0 : startIdx + 1}-{endIdx}
            </span>{" "}
            of <span className="font-semibold">{total}</span> candidates
          </div>
          <div className="flex items-center gap-3">
            <span>Rows per page: {PAGE_SIZE}</span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="text-xs">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
