import { redirect } from "next/navigation";
import { createServerSupabase } from "@/src/lib/supabase/server";
import MyApplicationsClient from "./my-applications-client";
import type { Job, WorkMode } from "@/src/data/jobs";

export type ApplicationStatus = "menunggu" | "diterima" | "ditolak";

type DbJoinedApplication = {
  id: string;
  job_id: string;
  status: string | null;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  domicile: string | null;
  gender: string | null;
  linkedin: string | null;
  jobs: {
    id: string;
    title: string;
    company: string;
    location: string;
    work_mode: WorkMode;
    level: string;
    job_type: Job["jobType"];
    company_logo: string | null;
    company_logo_alt: string | null;
  } | null;
};

export type MyApplication = {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    workMode: WorkMode;
    level: string;
    jobType: Job["jobType"];
    companyLogo: string | null;
    companyLogoAlt: string | null;
  };
  applicant: {
    fullName: string;
    email: string;
    phone: string | null;
    dob: string | null;
    domicile: string | null;
    gender: string | null;
    linkedin: string | null;
  };
};

export default async function MyApplicationsPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?error=unauthenticated");
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      [
        "id",
        "job_id",
        "status",
        "created_at",
        "full_name",
        "email",
        "phone",
        "dob",
        "domicile",
        "gender",
        "linkedin",
        // join ke tabel jobs via foreign key job_id → jobs.id
        "jobs(id, title, company, location, work_mode, level, job_type, company_logo, company_logo_alt)",
      ].join(",")
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load my applications:", error);
  }

  const rows: DbJoinedApplication[] = Array.isArray(data)
    ? (data as unknown as DbJoinedApplication[])
    : [];

  const applications: MyApplication[] = rows
    .filter((row) => row.jobs !== null)
    .map((row) => {
      const job = row.jobs!;
      const status =
        (row.status as ApplicationStatus | null) ??
        ("menunggu" as ApplicationStatus);

      return {
        id: row.id,
        status,
        createdAt: row.created_at,
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          workMode: job.work_mode,
          level: job.level,
          jobType: job.job_type,
          companyLogo: job.company_logo,
          companyLogoAlt: job.company_logo_alt,
        },
        applicant: {
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          dob: row.dob,
          domicile: row.domicile,
          gender: row.gender,
          linkedin: row.linkedin,
        },
      };
    });

  return <MyApplicationsClient applications={applications} />;
}
