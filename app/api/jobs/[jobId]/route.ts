import { NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";
import type {
  Job,
  JobStatus,
  WorkMode,
  ProfileRequirements,
  ProfileRequirementStatus,
} from "@/src/data/jobs";

type UpdateJobPayload = Partial<{
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
}>;

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

export async function PUT(
  req: Request,
  ctx: { params: { jobId: string } }
) {
  const { jobId } = ctx.params;
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

  const rawBody = (await req.json().catch(() => null)) as
    | UpdateJobPayload
    | null;

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};

  if (typeof rawBody.title === "string") {
    update.title = rawBody.title.trim();
  }
  if (isJobStatus(rawBody.status)) {
    update.status = rawBody.status;
  }
  if (rawBody.startedOn !== undefined) {
    update.started_at = rawBody.startedOn;
  }
  if (rawBody.salaryMin !== undefined) {
    update.salary_min =
      typeof rawBody.salaryMin === "number"
        ? Math.floor(rawBody.salaryMin)
        : null;
  }
  if (rawBody.salaryMax !== undefined) {
    update.salary_max =
      typeof rawBody.salaryMax === "number"
        ? Math.floor(rawBody.salaryMax)
        : null;
  }

  if (rawBody.jobType) {
    update.job_type = rawBody.jobType;
  }
  if (Array.isArray(rawBody.description)) {
    update.description = rawBody.description.map((d) => String(d));
  }
  if (typeof rawBody.candidatesNeeded === "number") {
    update.candidates_needed = rawBody.candidatesNeeded;
  }

  if (rawBody.profileRequirements) {
    const pr = rawBody.profileRequirements;
    const setIfValid = (
      key: keyof ProfileRequirements,
      column: string
    ) => {
      const value = pr[key];
      if (isProfileRequirementStatus(value)) {
        update[column] = value;
      }
    };

    setIfValid("full_name", "profile_full_name");
    setIfValid("photo", "profile_photo");
    setIfValid("gender", "profile_gender");
    setIfValid("domicile", "profile_domicile");
    setIfValid("email", "profile_email");
    setIfValid("phone", "profile_phone");
    setIfValid("linkedin", "profile_linkedin");
    setIfValid("dob", "profile_dob");
  }

  if (typeof rawBody.company === "string") {
    update.company = rawBody.company.trim();
  }
  if (rawBody.companyLogo !== undefined) {
    update.company_logo = rawBody.companyLogo;
  }
  if (rawBody.companyLogoAlt !== undefined) {
    update.company_logo_alt = rawBody.companyLogoAlt;
  }
  if (typeof rawBody.location === "string") {
    update.location = rawBody.location.trim();
  }
  if (isWorkMode(rawBody.workMode)) {
    update.work_mode = rawBody.workMode;
  }
  if (typeof rawBody.level === "string") {
    update.level = rawBody.level.trim();
  }
  if (Array.isArray(rawBody.tools)) {
    update.tools = rawBody.tools.map((t) => String(t));
  }
  if (Array.isArray(rawBody.skills)) {
    update.skills = rawBody.skills.map((s) => String(s));
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { message: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(update)
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) {
    console.error("Update job error:", error);
    return NextResponse.json(
      { message: "Failed to update job", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
