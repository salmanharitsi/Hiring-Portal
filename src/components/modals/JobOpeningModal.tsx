"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "./Modal";
import JobTypeSelect from "../form/JobTypeSelect";
import LocationSelect from "../form/LocationSelect";
import WorkModeSelect from "../form/WorkModeSelect";
import LevelSelect from "../form/LevelSelect";
import ToolsSelect from "../form/ToolsSelect";
import SkillsSelect from "../form/SkillsSelect";

type ProfileRequirementStatus = "mandatory" | "optional" | "off";

type ProfileRequirements = {
  full_name: ProfileRequirementStatus;
  photo: ProfileRequirementStatus;
  gender: ProfileRequirementStatus;
  domicile: ProfileRequirementStatus;
  email: ProfileRequirementStatus;
  phone: ProfileRequirementStatus;
  linkedin: ProfileRequirementStatus;
  dob: ProfileRequirementStatus;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
] as const;

export type JobOpeningForm = {
  jobName: string;
  jobType: (typeof JOB_TYPES)[number] | "";
  description: string;
  candidatesNeeded: string;
  salaryMin: string;
  salaryMax: string;
  location: string;
  workMode: "" | "Onsite" | "Remote" | "Hybrid" | "Jarak Jauh";
  level: string;
  tools: string[];
  skills: string[];
  profileRequirements: ProfileRequirements;
};

function RequirementToggleRow({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: keyof ProfileRequirements;
  value: ProfileRequirementStatus;
  onChange: (
    field: keyof ProfileRequirements,
    val: ProfileRequirementStatus
  ) => void;
}) {
  const baseBtn =
    "px-4 py-1.5 rounded-full text-[11px] font-semibold border transition-colors";
  const activePrimary =
    "bg-[#01959F] text-white border-[#01959F] shadow-[0_1px_2px_rgba(1,149,159,.35)]";
  const activeSecondary = "bg-zinc-100 text-zinc-700 border-zinc-300";
  const inactive = "bg-transparent text-zinc-400 border-zinc-200";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-200 last:border-b-0">
      <span className="text-xs text-[#404040]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`${baseBtn} ${
            value === "mandatory" ? activePrimary : inactive
          }`}
          onClick={() => onChange(field, "mandatory")}
        >
          Mandatory
        </button>
        <button
          type="button"
          className={`${baseBtn} ${
            value === "optional" ? activeSecondary : inactive
          }`}
          onClick={() => onChange(field, "optional")}
        >
          Optional
        </button>
        <button
          type="button"
          className={`${baseBtn} ${
            value === "off" ? activeSecondary : inactive
          }`}
          onClick={() => onChange(field, "off")}
        >
          Off
        </button>
      </div>
    </div>
  );
}

/** Hilangkan semua karakter non-digit, lalu parse ke number */
function parseCurrencyToNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (Number.isNaN(n)) return null;
  return n;
}

const INITIAL_FORM: JobOpeningForm = {
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

export default function JobOpeningModal({ open, onClose }: Props) {
  const [form, setForm] = useState<JobOpeningForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  function updateRequirement(
    field: keyof ProfileRequirements,
    val: ProfileRequirementStatus
  ) {
    setForm((prev) => ({
      ...prev,
      profileRequirements: { ...prev.profileRequirements, [field]: val },
    }));
  }

  async function handlePublish() {
    if (submitting) return;

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

    // Description → array per paragraf/baris
    const descriptionParts = trimmedDesc
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const body = {
      title: trimmedName,
      status: "active" as const, 
      startedOn: new Date().toISOString(),
      salaryMin: salaryMinNum,
      salaryMax: salaryMaxNum,

      jobType: form.jobType,
      description: descriptionParts,
      candidatesNeeded: candidates,
      profileRequirements: form.profileRequirements,

      // sementara hard-coded sampai nanti ada input khusus:
      company: "Rakamin",
      companyLogo: "/logo/simple-logo-rakamin.svg",
      companyLogoAlt: "Rakamin Logo",
      location: trimmedLocation,
      workMode: form.workMode || "Remote",
      level: form.level.trim(),
      tools: form.tools,
      skills: form.skills,
    };

    try {
      setSubmitting(true);

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        const message =
          data?.message ?? "Failed to create job vacancy. Please try again.";
        toast.error(message);
        return;
      }

      toast.success("Job vacancy successfully created.");
      resetForm();
      onClose();
    } catch (err) {
      console.error("Publish job error:", err);
      toast.error("Unexpected error while creating job.");
    } finally {
      setSubmitting(false);
    }
  }

  const canPublish =
    !submitting &&
    form.jobName.trim().length > 0 &&
    form.jobType !== "" &&
    form.location.trim().length > 0 &&
    form.workMode !== "" &&
    form.level.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.candidatesNeeded.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      className="flex flex-col max-h-[calc(95vh-2rem)] max-w-[700px]"
    >
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-zinc-200">
        <h2 className="text-lg font-semibold text-[#1D1F20]">Job Opening</h2>
        <button
          type="button"
          onClick={() => {
            if (!submitting) onClose();
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M6.4 5L5 6.4L10.6 12L5 17.6L6.4 19L12 13.4L17.6 19L19 17.6L13.4 12L19 6.4L17.6 5L12 10.6L6.4 5Z"
            />
          </svg>
        </button>
      </header>

      {/* BODY (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
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
              options={JOB_TYPES.map((jt) => ({ value: jt, label: jt }))}
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
            <label className="block mb-1 font-medium">
              Tools
            </label>
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
            <label className="block mb-1 font-medium">
              Skills
            </label>
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
              Number of Candidate Needed<span className="text-red-500">*</span>
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

          {/* Divider */}
          <div className="border-t border-dashed border-zinc-200 my-3" />

          {/* Job Salary */}
          <section className="space-y-3">
            <div className="text-xs font-semibold text-[#1D1F20]">
              Job Salary
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
              {/* Min salary */}
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

              {/* dash */}
              <div className="hidden sm:flex items-center justify-center pb-3 text-zinc-400">
                —
              </div>

              {/* Max salary */}
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
              <RequirementToggleRow
                label="Full name"
                field="full_name"
                value={form.profileRequirements.full_name}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Photo Profile"
                field="photo"
                value={form.profileRequirements.photo}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Gender"
                field="gender"
                value={form.profileRequirements.gender}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Domicile"
                field="domicile"
                value={form.profileRequirements.domicile}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Email"
                field="email"
                value={form.profileRequirements.email}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Phone number"
                field="phone"
                value={form.profileRequirements.phone}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Linkedin link"
                field="linkedin"
                value={form.profileRequirements.linkedin}
                onChange={updateRequirement}
              />
              <RequirementToggleRow
                label="Date of birth"
                field="dob"
                value={form.profileRequirements.dob}
                onChange={updateRequirement}
              />
            </div>
          </section>
        </form>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 px-6 md:px-8 py-4 flex justify-end">
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className="rounded-lg bg-[#01959F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#017A83] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
        >
          {submitting ? "Publishing..." : "Publish Job"}
        </button>
      </footer>
    </Modal>
  );
}
