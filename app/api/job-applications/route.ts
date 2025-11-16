import { NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

type Gender = "male" | "female";

interface JobApplicationPayload {
  jobId: string;
  full_name: string | null;
  dob: string | null;
  gender: Gender | null;
  domicile: string | null;
  phone: string | null;
  email: string | null;
  linkedin: string | null;
}

interface ValidationResult {
  ok: boolean;
  data?: JobApplicationPayload;
  message?: string;
}

function validatePayload(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Invalid request body" };
  }

  const {
    jobId,
    full_name,
    dob,
    gender,
    domicile,
    phone,
    email,
    linkedin,
  } = body as Record<string, unknown>;

  if (typeof jobId !== "string" || !jobId.trim()) {
    return { ok: false, message: "Job ID is required" };
  }

  const toNullableString = (val: unknown): string | null => {
    if (typeof val !== "string") return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  let finalGender: Gender | null = null;
  if (typeof gender === "string" && gender.trim()) {
    const g = gender.trim().toLowerCase();
    if (g === "male" || g === "female") {
      finalGender = g;
    } else {
      return { ok: false, message: "Invalid gender value" };
    }
  }

  const data: JobApplicationPayload = {
    jobId: jobId.trim(),
    full_name: toNullableString(full_name),
    dob: toNullableString(dob),
    gender: finalGender,
    domicile: toNullableString(domicile),
    phone: toNullableString(phone),
    email: toNullableString(email),
    linkedin: toNullableString(linkedin),
  };

  return { ok: true, data };
}

type ExistingApplicationRow = { id: string };

export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  // auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.json();
  const result = validatePayload(rawBody);

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { message: result.message ?? "Invalid payload" },
      { status: 422 }
    );
  }

  const { jobId, full_name, dob, gender, domicile, phone, email, linkedin } =
    result.data;

  // map gender ke format yang cocok dengan constraint di DB
  const dbGender =
    gender === null ? null : gender === "male" ? "Male" : "Female";

  // cek sudah pernah apply
  const { data: existingData, error: existingError } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .limit(1);

  if (existingError) {
    console.error("Check existing application error:", existingError);
    return NextResponse.json(
      {
        message: "Failed to check existing application",
        error: existingError.message,
      },
      { status: 500 }
    );
  }

  const existingRows = (existingData ?? []) as ExistingApplicationRow[];
  if (existingRows.length > 0) {
    return NextResponse.json(
      { message: "You have already applied for this job" },
      { status: 409 }
    );
  }

  // insert
  const { error: insertError } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      user_id: user.id,
      status: "menunggu", // 'menunggu' | 'diterima' | 'ditolak'
      full_name,
      dob,
      gender: dbGender,          // 👈 sudah di-map ke 'Male' / 'Female'
      domicile,
      phone,
      email,
      linkedin,
    });

  if (insertError) {
    console.error("Insert job_application error:", insertError);
    return NextResponse.json(
      {
        message: "Failed to submit application",
        error: insertError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Application submitted successfully" },
    { status: 201 }
  );
}
