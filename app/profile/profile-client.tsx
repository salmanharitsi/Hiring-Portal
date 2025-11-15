"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";
import DatePicker from "@/src/components/form/DatePicker";
import DomicileSelect from "@/src/components/form/DomicileSelect";
import PhoneNumberInput from "@/src/components/form/PhoneNumberInput";
import LinkedInInput from "@/src/components/form/LinkedInInput";
import { format, isValid, parseISO } from "date-fns";
import { useRole } from "./role-context";
import PhotoCaptureField from "@/src/components/form/PhotoCaptureField";
import { COUNTRIES } from "@/src/lib/phone/countries";
import { toast } from "sonner";

/* ============ TYPES ============ */

type Initial = {
  full_name: string;
  email: string;
  domicile: string;
  phone: string;
  linkedin: string;
  dob: string;
  photo_url: string | null;
};

type FieldErrorKey =
  | "photo_url"
  | "full_name"
  | "dob"
  | "domicile"
  | "phone"
  | "email"
  | "linkedin";

type FieldErrors = Partial<Record<FieldErrorKey, string>>;

/* ============ ROOT ============ */

export default function ProfileClient({
  avatarUrl,
  initial,
}: {
  avatarUrl: string;
  initial: Initial;
}) {
  const { role } = useRole();

  const resolvedAvatar = initial.photo_url || avatarUrl;

  if (role === "admin") {
    return (
      <AdminProfileCard
        googleAvatarUrl={avatarUrl || null}
        name={initial.full_name || initial.email}
        email={initial.email}
      />
    );
  }
  return <ApplicantProfileForm avatarUrl={resolvedAvatar} initial={initial} />;
}

function parseInitialPhone(raw: string | null | undefined): {
  iso2: string;   
  digits: string; 
} {
  if (!raw) {
    return { iso2: "ID", digits: "" };
  }

  const trimmed = raw.trim();
  const matched = COUNTRIES.find((c) => trimmed.startsWith(c.dial));

  if (!matched) {
    return {
      iso2: "ID",
      digits: trimmed.replace(/[^\d]/g, ""),
    };
  }

  const digits = trimmed
    .slice(matched.dial.length) 
    .replace(/[^\d]/g, "");     

  return { iso2: matched.iso2, digits };
}

function buildPhone(iso2: string, digits: string): string {
  const c = COUNTRIES.find((cc) => cc.iso2 === iso2);
  if (!digits) return "";
  if (!c) return `+${digits}`;
  return `${c.dial}${digits}`;
}


/* ===================== ADMIN ===================== */

function AdminProfileCard({
  googleAvatarUrl,
  name,
  email,
}: {
  googleAvatarUrl: string | null;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const safeName = (name || email || "Admin").trim();

  const initials = useMemo(() => {
    const parts = safeName.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return safeName.slice(0, 2).toUpperCase();
  }, [safeName]);

  const avatarBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 75% 85%)`;
  }, [safeName]);

  return (
    <section className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-[#1D1F20]">Profile</h1>
        <p className="text-sm text-zinc-500">Administrator account</p>
      </header>

      <div className="flex justify-center">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold px-2.5 py-0.5 border border-amber-200">
              ● Admin
            </span>
            <span className="text-xs text-zinc-400 ml-auto">V.0001</span>
          </div>

          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border bg-zinc-100">
                {googleAvatarUrl ? (
                  <Image
                    src={googleAvatarUrl}
                    alt="avatar"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full grid place-items-center text-[11px] font-semibold text-zinc-700"
                    style={{ background: avatarBg }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-[#1D1F20] uppercase tracking-wide">
                  {safeName}
                </div>
                <div className="text-xs text-zinc-500">{email}</div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M10 17v2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5v2H5v10zm4.59-10L17 9.41L15.41 11H9v2h6.41L17 14.59L14.59 17L20 11.59z"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== APPLICANT ===================== */

function ApplicantProfileForm({
  avatarUrl,
  initial,
}: {
  avatarUrl: string;
  initial: Initial;
}) {
  const router = useRouter();
  const supabase = createClient();

  // base class untuk input
  const baseInput =
    "w-full h-10 rounded-lg border px-4 outline-none text-sm placeholder:text-[#9E9E9E] text-[#404040]";
  const normalBorder =
    "border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
  const errorBorder =
    "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500";

  // STATE VALUE
  const [photo, setPhoto] = useState<string | null>(initial.photo_url ?? null);
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [dob, setDob] = useState(initial.dob ?? "");
  const [domicile, setDomicile] = useState(initial.domicile ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? "");

  const parsedPhone = parseInitialPhone(initial.phone);
  const [phoneDigits, setPhoneDigits] = useState(parsedPhone.digits);
  const [phoneCountry, setPhoneCountry] = useState(parsedPhone.iso2);

  // STATE ERROR
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // photo
  useEffect(() => {
    if (!photo) return;
    setFieldErrors((prev) =>
      prev.photo_url ? { ...prev, photo_url: undefined } : prev
    );
  }, [photo]);

  // full name
  useEffect(() => {
    if (!fullName.trim()) return;
    setFieldErrors((prev) =>
      prev.full_name ? { ...prev, full_name: undefined } : prev
    );
  }, [fullName]);

  // date of birth
  useEffect(() => {
    if (!dob) return;
    setFieldErrors((prev) => (prev.dob ? { ...prev, dob: undefined } : prev));
  }, [dob]);

  // domicile
  useEffect(() => {
    if (!domicile) return;
    setFieldErrors((prev) =>
      prev.domicile ? { ...prev, domicile: undefined } : prev
    );
  }, [domicile]);

  // phone number
  useEffect(() => {
    if (!phoneDigits.trim()) return;
    setFieldErrors((prev) =>
      prev.phone ? { ...prev, phone: undefined } : prev
    );
  }, [phoneDigits]);

  // email
  useEffect(() => {
    if (!email.trim()) return;
    setFieldErrors((prev) =>
      prev.email ? { ...prev, email: undefined } : prev
    );
  }, [email]);

  // linkedin
  useEffect(() => {
    if (!linkedin.trim()) return;
    setFieldErrors((prev) =>
      prev.linkedin ? { ...prev, linkedin: undefined } : prev
    );
  }, [linkedin]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function onSave() {
    setFormError(null);
    setFieldErrors({});

    const newErrors: FieldErrors = {};

    if (!photo) newErrors.photo_url = "Photo is required.";
    if (!fullName.trim()) newErrors.full_name = "Full name is required.";
    if (!dob) newErrors.dob = "Date of birth is required.";
    if (!domicile) newErrors.domicile = "Domicile is required.";
    if (!phoneDigits.trim()) newErrors.phone = "Phone number is required.";
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!linkedin.trim()) newErrors.linkedin = "LinkedIn URL is required.";

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setSubmitting(true);

    const phoneWithCode = buildPhone(phoneCountry, phoneDigits);

    const payload = {
      full_name: fullName.trim(),
      photo_url: photo, 
      dob,
      domicile,
      phone: phoneWithCode,
      email: email.trim(),
      linkedin: linkedin.trim(),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          setFieldErrors(data.errors as FieldErrors);
          toast.error("Please fix the highlighted fields.");
        } else {
          const msg = data?.message || "Failed to update profile.";
          setFormError(msg);
          toast.error(msg);
        }
        return;
      }

      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (err) {
      console.error(err);
      const msg = "Unexpected error. Please try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-4 text-[#1D1F20]">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-sm text-zinc-500">Perbarui data profilmu.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="font-semibold text-[#1D1F20]">Your Information</div>
          <div className="text-xs text-zinc-500">
            ℹ️ Make sure everything is correct
          </div>
        </div>

        <div className="p-6 text-xs">
          {/* Photo */}
          <div className="mb-6">
            <div className="text-red-500 mb-1 font-semibold">* Required</div>
            <div className="text-gray-700 mb-1 font-bold">Photo Profile</div>
            <PhotoCaptureField value={photo} onChange={setPhoto} />
            {fieldErrors.photo_url && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.photo_url}
              </p>
            )}
          </div>

          {/* Full name */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Full name
            </span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className={`${baseInput} ${
                fieldErrors.full_name ? errorBorder : normalBorder
              }`}
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.full_name}
              </p>
            )}
          </label>

          {/* DOB */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Date of birth
            </span>
            <div
              className={`rounded-lg ${
                fieldErrors.dob ? "border border-red-500" : ""
              }`}
            >
              <DatePicker
                value={
                  dob ? (isValid(parseISO(dob)) ? parseISO(dob) : null) : null
                }
                onChange={(d) => setDob(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="Select your date of birth"
                fromYear={1960}
                toYear={new Date().getFullYear()}
              />
            </div>
            {fieldErrors.dob && (
              <p className="mt-1 text-[11px] text-red-500">{fieldErrors.dob}</p>
            )}
          </label>

          {/* Domicile */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Domicile
            </span>
            <div
              className={`rounded-lg ${
                fieldErrors.domicile ? "border border-red-500" : ""
              }`}
            >
              <DomicileSelect value={domicile} onChange={setDomicile} />
            </div>
            {fieldErrors.domicile && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.domicile}
              </p>
            )}
          </label>

          {/* Phone */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Phone number
            </span>
            <div
              className={`rounded-lg ${
                fieldErrors.phone ? "border border-red-500" : ""
              }`}
            >
              <PhoneNumberInput
                value={phoneDigits}
                onChange={setPhoneDigits}
                country={phoneCountry}
                onCountryChange={(c) => setPhoneCountry(c.iso2)}
              />
            </div>
            {fieldErrors.phone && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.phone}
              </p>
            )}
          </label>

          {/* Email */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`${baseInput} ${
                fieldErrors.email ? errorBorder : normalBorder
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.email}
              </p>
            )}
          </label>

          {/* LinkedIn */}
          <label className="block">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Link LinkedIn
            </span>
            <div
              className={`rounded-lg ${
                fieldErrors.linkedin ? "border border-red-500" : ""
              }`}
            >
              <LinkedInInput value={linkedin} onChange={setLinkedin} />
            </div>
            {fieldErrors.linkedin && (
              <p className="mt-1 text-[11px] text-red-500">
                {fieldErrors.linkedin}
              </p>
            )}
          </label>

          {/* GLOBAL ERROR */}
          {formError && (
            <p className="mt-4 text-[11px] text-red-500">{formError}</p>
          )}
        </div>

        <div className="border-t px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">V.0001</span>
          <button
            onClick={onSave}
            disabled={submitting}
            className="rounded-lg bg-[#01959F] text-white font-semibold px-5 py-2 text-sm hover:bg-[#017A83] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="w-full">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-md border-red-200 text-white bg-red-500 hover:bg-red-400 font-bold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M10 17v2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5v2H5v10zm4.59-10L17 9.41L15.41 11H9v2h6.41L17 14.59L14.59 17L20 11.59z"
            />
          </svg>
          Logout
        </button>
      </div>
    </section>
  );
}
