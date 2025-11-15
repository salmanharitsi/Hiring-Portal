// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/src/lib/supabase/server";

interface ProfilePayload {
  full_name: string;
  photo_url: string;
  dob: string;       // dalam bentuk "YYYY-MM-DD"
  domicile: string;
  phone: string;
  linkedin: string;
}

type ValidationErrors = Partial<Record<keyof ProfilePayload, string>>;

function validatePayload(body: unknown): { data?: ProfilePayload; errors?: ValidationErrors } {
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
    },
  };
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabase();

  // pastikan user login
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

  const body = await request.json();
  const { data, errors } = validatePayload(body);

  if (errors) {
    return NextResponse.json(
      { message: "Validation failed", errors },
      { status: 422 }
    );
  }

  // data sudah tervalidasi
  const { full_name, photo_url, dob, domicile, phone, linkedin } = data as ProfilePayload;

  const { data: updatedProfile, error: dbError } = await supabase
    .from("profiles")
    .update({
      full_name,
      photo_url,
      dob,          // kolom tipe date di Supabase; string "YYYY-MM-DD" valid
      domicile,
      phone,
      linkedin,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id) // hanya boleh update profile miliknya sendiri
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
