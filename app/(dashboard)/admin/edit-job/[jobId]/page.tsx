"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/clients";
import JobTypeSelect from "@/src/components/form/JobTypeSelect";
import LocationSelect from "@/src/components/form/LocationSelect";
import WorkModeSelect from "@/src/components/form/WorkModeSelect";
import LevelSelect from "@/src/components/form/LevelSelect";
import ToolsSelect from "@/src/components/form/ToolsSelect";
import SkillsSelect from "@/src/components/form/SkillsSelect";
import type { JobOpeningForm } from "@/src/components/modals/JobOpeningModal";
import type { JobStatus } from "@/src/data/jobs";
import Link from "next/link";

type ProfileRequirementStatus = "mandatory" | "optional" | "off";

type DbJobForEdit = {
  id: string;
  title: string;
  status: JobStatus;
  started_at: string | null;
  job_type: JobOpeningForm["jobType"];
  description: string[] | null;
  candidates_needed: number | null;
  salary_min: number | null;
  salary_max: number | null;
  location: string;
  work_mode: JobOpeningForm["workMode"];
  level: string;
  tools: string[] | null;
  skills: string[] | null;
  profile_full_name: ProfileRequirementStatus;
  profile_photo: ProfileRequirementStatus;
  profile_gender: ProfileRequirementStatus;
  profile_domicile: ProfileRequirementStatus;
  profile_email: ProfileRequirementStatus;
  profile_phone: ProfileRequirementStatus;
  profile_linkedin: ProfileRequirementStatus;
  profile_dob: ProfileRequirementStatus;
};

type ProfileRequirements = JobOpeningForm["profileRequirements"];

function parseCurrencyToNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (Number.isNaN(n)) return null;
  return n;
}

const EMPTY_FORM: JobOpeningForm = {
  jobName: "",
  jobType: "",
  description: "",
  candidatesNeeded: "",
  salaryMin: "",
  salaryMax: "",
  location: "",
  workMode: "",
  level: "",
  tools: [],
  skills: [],
  profileRequirements: {
    full_name: "mandatory",
    photo: "mandatory",
    gender: "mandatory",
    domicile: "mandatory",
    email: "mandatory",
    phone: "mandatory",
    linkedin: "mandatory",
    dob: "mandatory",
  },
};

export default function EditJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<JobOpeningForm>(EMPTY_FORM);
  const [jobStatus, setJobStatus] = useState<JobStatus>("draft");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("jobs")
          .select(
            [
              "id",
              "title",
              "status",
              "started_at",
              "job_type",
              "description",
              "candidates_needed",
              "salary_min",
              "salary_max",
              "location",
              "work_mode",
              "level",
              "tools",
              "skills",
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
          console.error("Failed to load job for edit:", error);
          toast.error("Failed to load job.");
          router.push("/admin");
          return;
        }

        const row = data as unknown as DbJobForEdit;

        const descriptionJoined = (row.description ?? []).join("\n\n");

        const profileReqs: ProfileRequirements = {
          full_name: row.profile_full_name,
          photo: row.profile_photo,
          gender: row.profile_gender,
          domicile: row.profile_domicile,
          email: row.profile_email,
          phone: row.profile_phone,
          linkedin: row.profile_linkedin,
          dob: row.profile_dob,
        };

        setForm({
          jobName: row.title,
          jobType: row.job_type,
          description: descriptionJoined,
          candidatesNeeded:
            row.candidates_needed !== null ? String(row.candidates_needed) : "",
          salaryMin: row.salary_min !== null ? String(row.salary_min) : "",
          salaryMax: row.salary_max !== null ? String(row.salary_max) : "",
          location: row.location,
          workMode: row.work_mode,
          level: row.level,
          tools: row.tools ?? [],
          skills: row.skills ?? [],
          profileRequirements: profileReqs,
        });
        setJobStatus(row.status);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [jobId, router]);

  function updateRequirement(
    field: keyof ProfileRequirements,
    val: ProfileRequirementStatus
  ) {
    setForm((prev) => ({
      ...prev,
      profileRequirements: { ...prev.profileRequirements, [field]: val },
    }));
  }

  // ================== SAVE (UPDATE VIA SUPABASE CLIENT) ==================
  async function handleSave() {
    if (saving) return;

    const trimmedName = form.jobName.trim();
    const trimmedDesc = form.description.trim();
    const trimmedCandidates = form.candidatesNeeded.trim();
    const trimmedLocation = form.location.trim();

    if (!trimmedName) {
      toast.error("Job name is required.");
      return;
    }

    if (!form.jobType) {
      toast.error("Job type is required.");
      return;
    }

    if (!trimmedLocation) {
      toast.error("Location is required.");
      return;
    }

    if (!form.workMode) {
      toast.error("Work mode is required.");
      return;
    }

    if (!form.level.trim()) {
      toast.error("Level is required.");
      return;
    }

    if (!trimmedDesc) {
      toast.error("Job description is required.");
      return;
    }

    if (!trimmedCandidates) {
      toast.error("Number of candidates is required.");
      return;
    }

    const candidates = Number(trimmedCandidates);
    if (!Number.isFinite(candidates) || candidates <= 0) {
      toast.error("Number of candidates must be a positive number.");
      return;
    }

    const salaryMinNum = parseCurrencyToNumber(form.salaryMin);
    const salaryMaxNum = parseCurrencyToNumber(form.salaryMax);

    if (salaryMinNum === null && salaryMaxNum === null) {
      toast.error("Please fill at least minimum or maximum estimated salary.");
      return;
    }

    const descriptionParts = trimmedDesc
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updatePayload = {
      title: trimmedName,
      job_type: form.jobType,
      description: descriptionParts,
      candidates_needed: candidates,
      salary_min: salaryMinNum,
      salary_max: salaryMaxNum,
      location: trimmedLocation,
      work_mode: form.workMode || "Remote",
      level: form.level.trim(),
      tools: form.tools,
      skills: form.skills,
      profile_full_name: form.profileRequirements.full_name,
      profile_photo: form.profileRequirements.photo,
      profile_gender: form.profileRequirements.gender,
      profile_domicile: form.profileRequirements.domicile,
      profile_email: form.profileRequirements.email,
      profile_phone: form.profileRequirements.phone,
      profile_linkedin: form.profileRequirements.linkedin,
      profile_dob: form.profileRequirements.dob,
    };

    try {
      setSaving(true);

      const supabase = createClient();
      const { error } = await supabase
        .from("jobs")
        .update(updatePayload)
        .eq("id", jobId);

      if (error) {
        console.error("Update job error:", error);
        toast.error("Failed to update job vacancy. Please try again.");
        return;
      }

      toast.success("Job vacancy successfully updated.");
      // router.push("/admin");
    } catch (err) {
      console.error("Update job unexpected error:", err);
      toast.error("Unexpected error while updating job.");
    } finally {
      setSaving(false);
    }
  }

  // ================== DELETE (langsung via Supabase client) ==================
  function handleDeleteClick() {
    if (deleting) return;

    toast.error("Hapus lowongan ini?", {
      description: "Tindakan ini tidak dapat dibatalkan.",
      action: {
        label: deleting ? "Menghapus..." : "Hapus",
        onClick: async () => {
          try {
            setDeleting(true);
            const supabase = createClient();

            const { error: appsError } = await supabase
              .from("job_applications")
              .delete()
              .eq("job_id", jobId);

            if (appsError) {
              console.error("Delete job applications error:", appsError);
              toast.error(
                "Failed to delete job applications. Please try again."
              );
              setDeleting(false);
              return;
            }

            const { error: jobError } = await supabase
              .from("jobs")
              .delete()
              .eq("id", jobId);

            if (jobError) {
              console.error("Delete job error:", jobError);
              toast.error("Failed to delete job vacancy. Please try again.");
              setDeleting(false);
              return;
            }

            toast.success("Job vacancy deleted.");
            router.push("/admin");
          } catch (err) {
            console.error("Delete job unexpected error:", err);
            toast.error("Unexpected error while deleting job.");
          } finally {
            setDeleting(false);
          }
        },
      },
    });
  }

  const canSave =
    !saving &&
    form.jobName.trim().length > 0 &&
    form.jobType !== "" &&
    form.location.trim().length > 0 &&
    form.workMode !== "" &&
    form.level.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.candidatesNeeded.trim().length > 0;

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl py-6 text-sm text-zinc-500">
        Loading job for edit…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin"
            className="inline-flex items-center font-bold rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Job list
          </Link>
          <span className="text-lg text-zinc-800">›</span>
          <span className="inline-flex items-center font-bold rounded-md border border-zinc-200 bg-slate-100 px-3 py-1 text-xs text-zinc-700">
            Edit Job
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#1D1F20] w-full">Edit Job</h1>
        <p className="text-xs text-zinc-500">
          Status: <span className="font-semibold uppercase">{jobStatus}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
          <form className="space-y-5 text-xs text-[#404040]">
            {/* Job Name */}
            <div>
              <label className="block mb-1 font-medium">
                Job Name<span className="text-red-500">*</span>
              </label>
              <input
                value={form.jobName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, jobName: e.target.value }))
                }
                placeholder="Ex. Front End Engineer"
                className="w-full h-10 rounded-lg border border-zinc-300 px-4 text-sm placeholder:text-zinc-400 outline-none focus:border-[#01959F] focus:ring-1 focus:ring-[#01959F]"
              />
            </div>

            {/* Job Type */}
            <div>
              <label className="block mb-1 font-medium">
                Job Type<span className="text-red-500">*</span>
              </label>
              <JobTypeSelect
                value={form.jobType}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    jobType: v as JobOpeningForm["jobType"],
                  }))
                }
                options={[
                  "Full-time",
                  "Part-time",
                  "Contract",
                  "Internship",
                  "Freelance",
                ].map((jt) => ({ value: jt, label: jt }))}
                placeholder="Select job type"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1 font-medium">
                Location<span className="text-red-500">*</span>
              </label>
              <LocationSelect
                value={form.location}
                onChange={(loc) =>
                  setForm((prev) => ({
                    ...prev,
                    location: loc,
                  }))
                }
                placeholder="Select location"
              />
            </div>

            {/* Work Mode */}
            <div>
              <label className="block mb-1 font-medium">
                Work Mode<span className="text-red-500">*</span>
              </label>
              <WorkModeSelect
                value={form.workMode}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    workMode: v as JobOpeningForm["workMode"],
                  }))
                }
                placeholder="Select work mode"
              />
            </div>

            {/* Level */}
            <div>
              <label className="block mb-1 font-medium">
                Level<span className="text-red-500">*</span>
              </label>
              <LevelSelect
                value={form.level}
                onChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    level: v,
                  }))
                }
              />
            </div>

            {/* Tools */}
            <div>
              <label className="block mb-1 font-medium">Tools</label>
              <ToolsSelect
                value={form.tools}
                onChange={(next) =>
                  setForm((prev) => ({
                    ...prev,
                    tools: next,
                  }))
                }
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block mb-1 font-medium">Skills</label>
              <SkillsSelect
                value={form.skills}
                onChange={(next) =>
                  setForm((prev) => ({
                    ...prev,
                    skills: next,
                  }))
                }
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block mb-1 font-medium">
                Job Description<span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ex."
                className="w-full min-h-24 rounded-lg border border-zinc-300 px-4 py-2 text-sm placeholder:text-zinc-400 outline-none focus:border-[#01959F] focus:ring-1 focus:ring-[#01959F] resize-none"
              />
            </div>

            {/* Number of Candidate Needed */}
            <div>
              <label className="block mb-1 font-medium">
                Number of Candidate Needed
                <span className="text-red-500">*</span>
              </label>
              <input
                value={form.candidatesNeeded}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    candidatesNeeded: e.target.value.replace(/[^\d]/g, ""),
                  }))
                }
                placeholder="Ex. 2"
                inputMode="numeric"
                className="w-full h-10 rounded-lg border border-zinc-300 px-4 text-sm placeholder:text-zinc-400 outline-none focus:border-[#01959F] focus:ring-1 focus:ring-[#01959F]"
              />
            </div>

            <div className="border-t border-dashed border-zinc-200 my-3" />

            {/* Job Salary */}
            <section className="space-y-3">
              <div className="text-xs font-semibold text-[#1D1F20]">
                Job Salary
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-500">
                    Minimum Estimated Salary
                  </div>
                  <div className="flex h-10 rounded-lg border border-zinc-300 overflow-hidden bg-white">
                    <span className="inline-flex items-center px-3 text-xs text-zinc-500 border-r border-zinc-200 font-bold">
                      Rp
                    </span>
                    <input
                      value={form.salaryMin}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salaryMin: e.target.value,
                        }))
                      }
                      placeholder="7.000.000"
                      className="flex-1 px-2 text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-center pb-3 text-zinc-400">
                  —
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-500">
                    Maximum Estimated Salary
                  </div>
                  <div className="flex h-10 rounded-lg border border-zinc-300 overflow-hidden bg-white">
                    <span className="inline-flex items-center px-3 text-xs text-zinc-500 border-r border-zinc-200 font-bold">
                      Rp
                    </span>
                    <input
                      value={form.salaryMax}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salaryMax: e.target.value,
                        }))
                      }
                      placeholder="8.000.000"
                      className="flex-1 px-2 text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Minimum Profile Information Required */}
            <section className="mt-4 rounded-xl border border-zinc-200 bg-white">
              <div className="px-4 py-3 border-b border-zinc-200 text-xs font-semibold text-[#1D1F20]">
                Minimum Profile Information Required
              </div>
              <div className="px-4">
                {(
                  [
                    ["Full name", "full_name"],
                    ["Photo Profile", "photo"],
                    ["Gender", "gender"],
                    ["Domicile", "domicile"],
                    ["Email", "email"],
                    ["Phone number", "phone"],
                    ["Linkedin link", "linkedin"],
                    ["Date of birth", "dob"],
                  ] as const
                ).map(([label, fieldKey]) => {
                  const value =
                    form.profileRequirements[
                      fieldKey as keyof ProfileRequirements
                    ];
                  const baseBtn =
                    "px-4 py-1.5 rounded-full text-[11px] font-semibold border transition-colors";
                  const activePrimary =
                    "bg-[#01959F] text-white border-[#01959F] shadow-[0_1px_2px_rgba(1,149,159,.35)]";
                  const activeSecondary =
                    "bg-zinc-100 text-zinc-700 border-zinc-300";
                  const inactive =
                    "bg-transparent text-zinc-400 border-zinc-200";

                  return (
                    <div
                      key={fieldKey}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 border-b border-zinc-200 last:border-b-0"
                    >
                      <span className="text-xs text-[#404040]">{label}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`${baseBtn} ${
                            value === "mandatory" ? activePrimary : inactive
                          }`}
                          onClick={() =>
                            updateRequirement(
                              fieldKey as keyof ProfileRequirements,
                              "mandatory"
                            )
                          }
                        >
                          Mandatory
                        </button>
                        <button
                          type="button"
                          className={`${baseBtn} ${
                            value === "optional" ? activeSecondary : inactive
                          }`}
                          onClick={() =>
                            updateRequirement(
                              fieldKey as keyof ProfileRequirements,
                              "optional"
                            )
                          }
                        >
                          Optional
                        </button>
                        <button
                          type="button"
                          className={`${baseBtn} ${
                            value === "off" ? activeSecondary : inactive
                          }`}
                          onClick={() =>
                            updateRequirement(
                              fieldKey as keyof ProfileRequirements,
                              "off"
                            )
                          }
                        >
                          Off
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </form>
        </div>

        <footer className="flex flex-col gap-2 border-t border-zinc-200 px-5 md:px-6 py-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Hapus Job"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center rounded-lg bg-[#01959F] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#017A83] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Perbarui data"}
          </button>
        </footer>
      </section>
    </main>
  );
}
