"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "@/src/components/form/DatePicker";
import { parseISO, isValid, format } from "date-fns";
import Modal from "./Modal";
import DomicileSelect from "../form/DomicileSelect";
import PhoneNumberInput from "../form/PhoneNumberInput";
import LinkedInInput from "../form/LinkedInInput";
import PhotoCaptureField from "../form/PhotoCaptureField";
import { createClient } from "@/src/lib/supabase/clients";
import { COUNTRIES, type Country } from "@/src/lib/phone/countries";
import { toast } from "sonner";

type Gender = "male" | "female";

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
  jobId: string;
  jobTitle: string;
  company: string;
  onApplied?: (jobId: string) => void;
};

const DEFAULT_REQUIREMENTS: ProfileRequirements = {
  full_name: "mandatory",
  photo: "mandatory",
  gender: "mandatory",
  domicile: "mandatory",
  email: "mandatory",
  phone: "mandatory",
  linkedin: "mandatory",
  dob: "mandatory",
};

function isProfileRequirementStatus(
  value: unknown
): value is ProfileRequirementStatus {
  return value === "mandatory" || value === "optional" || value === "off";
}

function parseInitialPhone(raw: string | null | undefined): {
  iso2: string;
  digits: string;
} {
  if (!raw) return { iso2: "ID", digits: "" };

  const trimmed = raw.trim();
  const matched = COUNTRIES.find((c) => trimmed.startsWith(c.dial));

  if (!matched) {
    return {
      iso2: "ID",
      digits: trimmed.replace(/[^\d]/g, ""),
    };
  }

  const digits = trimmed.slice(matched.dial.length).replace(/[^\d]/g, "");

  return { iso2: matched.iso2, digits };
}

function buildPhone(iso2: string, digits: string): string {
  const c = COUNTRIES.find((cc) => cc.iso2 === iso2);
  if (!digits) return "";
  if (!c) return `+${digits}`;
  return `${c.dial}${digits}`;
}

function isEmpty(value: string | null | undefined): boolean {
  return !value || !value.toString().trim();
}

// row job untuk kolom requirement di DB
interface JobProfileReqRow {
  profile_full_name: ProfileRequirementStatus | null;
  profile_photo: ProfileRequirementStatus | null;
  profile_gender: ProfileRequirementStatus | null;
  profile_domicile: ProfileRequirementStatus | null;
  profile_email: ProfileRequirementStatus | null;
  profile_phone: ProfileRequirementStatus | null;
  profile_linkedin: ProfileRequirementStatus | null;
  profile_dob: ProfileRequirementStatus | null;
}

function buildRequirementsFromRow(
  row: JobProfileReqRow | null
): ProfileRequirements {
  if (!row) return DEFAULT_REQUIREMENTS;

  const result: ProfileRequirements = { ...DEFAULT_REQUIREMENTS };

  if (isProfileRequirementStatus(row.profile_full_name)) {
    result.full_name = row.profile_full_name;
  }
  if (isProfileRequirementStatus(row.profile_photo)) {
    result.photo = row.profile_photo;
  }
  if (isProfileRequirementStatus(row.profile_gender)) {
    result.gender = row.profile_gender;
  }
  if (isProfileRequirementStatus(row.profile_domicile)) {
    result.domicile = row.profile_domicile;
  }
  if (isProfileRequirementStatus(row.profile_email)) {
    result.email = row.profile_email;
  }
  if (isProfileRequirementStatus(row.profile_phone)) {
    result.phone = row.profile_phone;
  }
  if (isProfileRequirementStatus(row.profile_linkedin)) {
    result.linkedin = row.profile_linkedin;
  }
  if (isProfileRequirementStatus(row.profile_dob)) {
    result.dob = row.profile_dob;
  }

  return result;
}

export default function ApplyFormModal({
  open,
  onClose,
  jobId,
  jobTitle,
  company,
  onApplied,
}: Props) {
  const supabase = createClient();

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingReq, setLoadingReq] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [requirements, setRequirements] = useState<ProfileRequirements | null>(
    null
  );

  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState<string>("");
  const [gender, setGender] = useState<Gender | "">("");
  const [domicile, setDomicile] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("ID");

  const effectiveReq: ProfileRequirements =
    requirements ?? DEFAULT_REQUIREMENTS;

  const isFieldVisible = (key: keyof ProfileRequirements): boolean =>
    effectiveReq[key] !== "off";

  const isFieldMandatory = (key: keyof ProfileRequirements): boolean =>
    effectiveReq[key] === "mandatory";

  /* ===== Prefill profile user saat modal dibuka ===== */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadProfile() {
      try {
        setLoadingProfile(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select(
            "full_name, email, domicile, phone, linkedin, dob, photo_url, gender"
          )
          .eq("id", user.id)
          .single();

        if (error || !profile || cancelled) return;

        setPhoto(profile.photo_url ?? null);
        setFullName(profile.full_name ?? user.user_metadata?.full_name ?? "");
        setEmail(profile.email ?? user.email ?? "");
        setDomicile(profile.domicile ?? "");
        setLinkedin(profile.linkedin ?? "");
        setDob(profile.dob ?? "");

        const rawGender = (profile.gender ?? "")
          .toString()
          .trim()
          .toLowerCase();

        if (rawGender === "male" || rawGender === "female") {
          setGender(rawGender);
        } else {
          setGender("");
        }

        const parsed = parseInitialPhone(profile.phone);
        setPhoneCountry(parsed.iso2);
        setPhoneDigits(parsed.digits);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  /* ===== Prefill requirement job dari DB ===== */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadRequirements() {
      try {
        setLoadingReq(true);

        const { data, error } = await supabase
          .from("jobs")
          .select(
            "profile_full_name, profile_photo, profile_gender, profile_domicile, profile_email, profile_phone, profile_linkedin, profile_dob"
          )
          .eq("id", jobId)
          .single<JobProfileReqRow>();

        if (error || !data || cancelled) {
          setRequirements(DEFAULT_REQUIREMENTS);
          return;
        }

        if (!cancelled) {
          setRequirements(buildRequirementsFromRow(data));
        }
      } finally {
        if (!cancelled) setLoadingReq(false);
      }
    }

    void loadRequirements();

    return () => {
      cancelled = true;
    };
  }, [open, jobId, supabase]);

  const linkedinOk = useMemo(() => {
    const value = linkedin.trim();
    if (!value) return true; // optional / off boleh kosong
    const r =
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9._%-]+\/?$/i;
    return r.test(value);
  }, [linkedin]);

  const phone = buildPhone(phoneCountry, phoneDigits);

  async function onSubmit() {
    if (submitting) return;

    const missing: string[] = [];

    if (isFieldVisible("photo") && isFieldMandatory("photo") && !photo) {
      missing.push("Photo");
    }
    if (
      isFieldVisible("full_name") &&
      isFieldMandatory("full_name") &&
      isEmpty(fullName)
    ) {
      missing.push("Full name");
    }
    if (isFieldVisible("dob") && isFieldMandatory("dob") && isEmpty(dob)) {
      missing.push("Date of birth");
    }
    if (
      isFieldVisible("gender") &&
      isFieldMandatory("gender") &&
      (!gender || (gender !== "male" && gender !== "female"))
    ) {
      missing.push("Gender");
    }
    if (
      isFieldVisible("domicile") &&
      isFieldMandatory("domicile") &&
      isEmpty(domicile)
    ) {
      missing.push("Domicile");
    }
    if (
      isFieldVisible("phone") &&
      isFieldMandatory("phone") &&
      isEmpty(phoneDigits)
    ) {
      missing.push("Phone number");
    }
    if (
      isFieldVisible("email") &&
      isFieldMandatory("email") &&
      isEmpty(email)
    ) {
      missing.push("Email");
    }
    if (
      isFieldVisible("linkedin") &&
      isFieldMandatory("linkedin") &&
      isEmpty(linkedin)
    ) {
      missing.push("LinkedIn URL");
    }

    if (missing.length > 0) {
      toast.error(
        `Please fill all mandatory fields:\n- ${missing.join("\n- ")}`
      );
      return;
    }

    if (isFieldVisible("linkedin") && !linkedinOk) {
      toast.error("Please enter a valid LinkedIn URL.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        jobId,
        full_name: isFieldVisible("full_name") ? fullName.trim() || null : null,
        dob: isFieldVisible("dob") ? dob || null : null,
        gender: isFieldVisible("gender") ? gender || null : null,
        domicile: isFieldVisible("domicile") ? domicile || null : null,
        phone: isFieldVisible("phone") ? phone || null : null,
        email: isFieldVisible("email") ? email.trim() || null : null,
        linkedin: isFieldVisible("linkedin") ? linkedin.trim() || null : null,
        photo_url: isFieldVisible("photo") ? photo || null : null,
      };

      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (res.status === 401) {
        toast.error("You must be logged in to apply.");
        return;
      }

      if (res.status === 409) {
        toast.error("You have already applied for this job.");
        if (onApplied) onApplied(jobId);
        onClose();
        return;
      }

      if (!res.ok) {
        const msg = data?.message || "Failed to submit application.";
        toast.error(msg);
        return;
      }

      toast.success(data?.message ?? "Application submitted successfully.");
      if (onApplied) {
        onApplied(jobId);
      }
      onClose();
    } catch (err) {
      console.error("Unexpected error while submitting application:", err);
      toast.error("Unexpected error while submitting application.");
    } finally {
      setSubmitting(false);
    }
  }

  const showLoadingBanner = loadingProfile || loadingReq;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex flex-col max-h-[calc(95vh-2rem)] max-w-[700px]"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center items-start gap-3 px-6 md:px-8 py-6 text-[#1D1F20]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 border border-[#E0E0E0]"
            aria-label="Back"
            type="button"
          >
            <Image
              src="/icon/arrow-left.svg"
              alt="Arrow left"
              width={20}
              height={20}
            />
          </button>
          <div className="font-bold text-lg">
            Apply {jobTitle} at {company}
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-sm">ℹ️</span>
          <span>This field required to fill</span>
          {showLoadingBanner && (
            <span className="ml-1 text-[11px] text-teal-600">
              Loading your profile &amp; requirements...
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-0 md:px-8 pb-6">
        <div className="px-6 text-xs">
          {/* Photo */}
          {isFieldVisible("photo") && (
            <div className="mb-6 font-bold">
              {isFieldMandatory("photo") && (
                <div className="text-red-500 mb-1">* Required</div>
              )}
              <div className="text-gray-700 mb-3 font-bold">Photo Profile</div>
              <PhotoCaptureField value={photo} onChange={setPhoto} />
            </div>
          )}

          {/* Full name */}
          {isFieldVisible("full_name") && (
            <label className="block mb-5">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Full name
                {isFieldMandatory("full_name") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-10 rounded-lg border border-gray-300 px-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-[#9E9E9E] text-[#404040]"
              />
            </label>
          )}

          {/* DOB */}
          {isFieldVisible("dob") && (
            <label className="block mb-5">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Date of birth
                {isFieldMandatory("dob") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <DatePicker
                value={
                  dob ? (isValid(parseISO(dob)) ? parseISO(dob) : null) : null
                }
                onChange={(d) => {
                  setDob(d ? format(d, "yyyy-MM-dd") : "");
                }}
                placeholder="Select your date of birth"
                fromYear={1960}
                toYear={new Date().getFullYear()}
              />
            </label>
          )}

          {/* Gender */}
          {isFieldVisible("gender") && (
            <fieldset className="mb-5">
              <legend className="block text-xs text-gray-700 mb-3 font-medium">
                Pronoun (gender)
                {isFieldMandatory("gender") && (
                  <span className="text-red-600">*</span>
                )}
              </legend>
              <div className="flex items-center gap-8 text-[#404040]">
                <label className="inline-flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>She/her (Female)</span>
                </label>
                <label className="inline-flex items-center gap-2.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span>He/him (Male)</span>
                </label>
              </div>
            </fieldset>
          )}

          {/* Domicile */}
          {isFieldVisible("domicile") && (
            <label className="block mb-5">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Domicile
                {isFieldMandatory("domicile") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <DomicileSelect value={domicile} onChange={setDomicile} />
            </label>
          )}

          {/* Phone */}
          {isFieldVisible("phone") && (
            <label className="block mb-5">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Phone number
                {isFieldMandatory("phone") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <PhoneNumberInput
                value={phoneDigits}
                onChange={setPhoneDigits}
                country={phoneCountry}
                onCountryChange={(c: Country) => setPhoneCountry(c.iso2)}
              />
            </label>
          )}

          {/* Email */}
          {isFieldVisible("email") && (
            <label className="block mb-5">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Email
                {isFieldMandatory("email") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-10 rounded-lg border border-gray-300 px-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-[#9E9E9E] text-[#404040]"
              />
            </label>
          )}

          {/* LinkedIn */}
          {isFieldVisible("linkedin") && (
            <label className="block">
              <span className="block text-xs text-gray-700 mb-2 font-medium">
                Link LinkedIn
                {isFieldMandatory("linkedin") && (
                  <span className="text-red-600">*</span>
                )}
              </span>
              <LinkedInInput
                value={linkedin}
                onChange={setLinkedin}
                required={isFieldMandatory("linkedin")}
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-gray-200 px-6 md:px-8 py-6">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-[#01959F] text-white font-semibold py-3 text-sm hover:bg-[#017A83] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </Modal>
  );
}
