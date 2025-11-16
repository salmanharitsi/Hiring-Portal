import { NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";
import type {
  Job,
  JobStatus,
  WorkMode,
  ProfileRequirements,
  ProfileRequirementStatus,
} from "@/src/data/jobs";

type CreateJobPayload = {
  title: string;
  status: JobStatus;
  startedOn: string | null;
  salaryMin: number | null;
  salaryMax: number | null;

  jobType: Job["jobType"];
  description: string[];
  candidatesNeeded: number;
  profileRequirements: ProfileRequirements;

  company: string;
  companyLogo: string | null;
  companyLogoAlt: string | null;
  location: string;
  workMode: WorkMode;
  level: string;
  tools: string[];
  skills: string[];
};

type ValidationResult =
  | { ok: true; data: CreateJobPayload }
  | { ok: false; message: string };

function isJobStatus(value: unknown): value is JobStatus {
  return value === "active" || value === "inactive" || value === "draft";
}

function isWorkMode(value: unknown): value is WorkMode {
  return (
    value === "Onsite" ||
    value === "Remote" ||
    value === "Hybrid" ||
    value === "Jarak Jauh"
  );
}

function isProfileRequirementStatus(
  value: unknown
): value is ProfileRequirementStatus {
  return value === "mandatory" || value === "optional" || value === "off";
}

function validatePayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invalid JSON body" };
  }

  const obj = raw as Record<string, unknown>;

  const title = obj.title;
  const jobType = obj.jobType;
  const description = obj.description;
  const candidatesNeeded = obj.candidatesNeeded;
  const profileReqRaw = obj.profileRequirements;
  const company = obj.company;
  const companyLogo = obj.companyLogo;
  const companyLogoAlt = obj.companyLogoAlt;
  const location = obj.location;
  const workMode = obj.workMode;
  const level = obj.level;
  const tools = obj.tools;
  const skills = obj.skills;
  const status = obj.status;
  const startedOn = obj.startedOn;
  const salaryMin = obj.salaryMin;
  const salaryMax = obj.salaryMax;

  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, message: "Title is required" };
  }

  if (typeof jobType !== "string" || !jobType.trim()) {
    return { ok: false, message: "Job type is required" };
  }

  if (!Array.isArray(description) || description.length === 0) {
    return { ok: false, message: "Description is required" };
  }

  if (typeof candidatesNeeded !== "number" || candidatesNeeded < 1) {
    return {
      ok: false,
      message: "candidatesNeeded must be a positive number",
    };
  }

  if (!profileReqRaw || typeof profileReqRaw !== "object") {
    return { ok: false, message: "profileRequirements is required" };
  }

  const prObj = profileReqRaw as Record<string, unknown>;
  const profileRequirements: ProfileRequirements = {
    full_name: prObj.full_name,
    photo: prObj.photo,
    gender: prObj.gender,
    domicile: prObj.domicile,
    email: prObj.email,
    phone: prObj.phone,
    linkedin: prObj.linkedin,
    dob: prObj.dob,
  } as ProfileRequirements;

  const prKeys: (keyof ProfileRequirements)[] = [
    "full_name",
    "photo",
    "gender",
    "domicile",
    "email",
    "phone",
    "linkedin",
    "dob",
  ];

  for (const key of prKeys) {
    const value = prObj[key];
    if (!isProfileRequirementStatus(value)) {
      return {
        ok: false,
        message: `Invalid profileRequirements.${key}`,
      };
    }
    profileRequirements[key] = value;
  }

  if (typeof company !== "string" || !company.trim()) {
    return { ok: false, message: "Company is required" };
  }

  if (typeof location !== "string" || !location.trim()) {
    return { ok: false, message: "Location is required" };
  }

  if (!isWorkMode(workMode)) {
    return { ok: false, message: "Invalid workMode" };
  }

  if (typeof level !== "string" || !level.trim()) {
    return { ok: false, message: "Level is required" };
  }

  const toolsArr =
    Array.isArray(tools) && tools.length > 0
      ? tools.map((t) => String(t))
      : [];
  const skillsArr =
    Array.isArray(skills) && skills.length > 0
      ? skills.map((s) => String(s))
      : [];

  const parsed: CreateJobPayload = {
    title: title.trim(),
    status: isJobStatus(status) ? status : "draft",
    startedOn:
      typeof startedOn === "string" && startedOn.trim()
        ? startedOn
        : null,
    salaryMin:
      typeof salaryMin === "number" ? Math.floor(salaryMin) : null,
    salaryMax:
      typeof salaryMax === "number" ? Math.floor(salaryMax) : null,

    jobType: jobType as Job["jobType"],
    description: description.map((d) => String(d)),
    candidatesNeeded,

    profileRequirements,

    company: company.trim(),
    companyLogo:
      typeof companyLogo === "string" && companyLogo.trim()
        ? companyLogo
        : null,
    companyLogoAlt:
      typeof companyLogoAlt === "string" && companyLogoAlt.trim()
        ? companyLogoAlt
        : null,
    location: location.trim(),
    workMode,
    level: level.trim(),
    tools: toolsArr,
    skills: skillsArr,
  };

  return { ok: true, data: parsed };
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthenticated" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = validatePayload(rawBody);

  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.message },
      { status: 422 }
    );
  }

  const p = parsed.data;

  const insertData = {
    title: p.title,
    status: p.status,
    started_at: p.startedOn,
    salary_min: p.salaryMin,
    salary_max: p.salaryMax,
    job_type: p.jobType,
    description: p.description,
    candidates_needed: p.candidatesNeeded,

    profile_full_name: p.profileRequirements.full_name,
    profile_photo: p.profileRequirements.photo,
    profile_gender: p.profileRequirements.gender,
    profile_domicile: p.profileRequirements.domicile,
    profile_email: p.profileRequirements.email,
    profile_phone: p.profileRequirements.phone,
    profile_linkedin: p.profileRequirements.linkedin,
    profile_dob: p.profileRequirements.dob,

    company: p.company,
    company_logo: p.companyLogo,
    company_logo_alt: p.companyLogoAlt,
    location: p.location,
    work_mode: p.workMode,
    level: p.level,
    tools: p.tools,
    skills: p.skills,

    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    console.error("Create job error:", error);
    return NextResponse.json(
      { message: "Failed to create job", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
