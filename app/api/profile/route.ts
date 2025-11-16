import { NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

type Gender = "male" | "female";

interface ProfilePayload {
  full_name: string;
  photo_url: string;
  dob: string; // "YYYY-MM-DD"
  domicile: string;
  phone: string;
  linkedin: string;
  gender: Gender;
}

type ValidationErrors = Partial<Record<keyof ProfilePayload, string>>;

function isGender(value: unknown): value is Gender {
  return value === "male" || value === "female";
}

function validatePayload(
  body: unknown
): { data?: ProfilePayload; errors?: ValidationErrors } {
  if (typeof body !== "object" || body === null) {
    return { errors: { full_name: "Invalid request body" } };
  }

  const {
    full_name,
    photo_url,
    dob,
    domicile,
    phone,
    linkedin,
    gender,
  } = body as Record<string, unknown>;

  const errors: ValidationErrors = {};

  // full_name
  if (typeof full_name !== "string" || !full_name.trim()) {
    errors.full_name = "Full name is required.";
  }

  // photo_url
  if (typeof photo_url !== "string" || !photo_url.trim()) {
    errors.photo_url = "Photo is required.";
  }

  // dob (YYYY-MM-DD)
  if (typeof dob !== "string" || !dob.trim()) {
    errors.dob = "Date of birth is required.";
  } else if (Number.isNaN(Date.parse(dob))) {
    errors.dob = "Date of birth is not a valid date.";
  }

  // domicile
  if (typeof domicile !== "string" || !domicile.trim()) {
    errors.domicile = "Domicile is required.";
  }

  // phone
  if (typeof phone !== "string" || !phone.trim()) {
    errors.phone = "Phone number is required.";
  }

  // linkedin
  if (typeof linkedin !== "string" || !linkedin.trim()) {
    errors.linkedin = "LinkedIn URL is required.";
  }

  // gender
  if (!isGender(gender)) {
    errors.gender = "Gender is required.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      full_name: (full_name as string).trim(),
      photo_url: (photo_url as string).trim(),
      dob: (dob as string).trim(),
      domicile: (domicile as string).trim(),
      phone: (phone as string).trim(),
      linkedin: (linkedin as string).trim(),
      gender: gender as Gender,
    },
  };
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as unknown;
  const { data, errors } = validatePayload(body);

  if (errors) {
    return NextResponse.json(
      { message: "Validation failed", errors },
      { status: 422 }
    );
  }

  const { full_name, photo_url, dob, domicile, phone, linkedin, gender } =
    data as ProfilePayload;

  const { data: updatedProfile, error: dbError } = await supabase
    .from("profiles")
    .update({
      full_name,
      photo_url,
      dob,
      domicile,
      phone,
      linkedin,
      gender,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json(
      { message: "Failed to update profile", error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Profile updated successfully",
      profile: updatedProfile,
    },
    { status: 200 }
  );
}
