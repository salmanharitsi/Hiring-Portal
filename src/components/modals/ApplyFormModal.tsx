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

type Props = {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
};

function parseInitialPhone(
  raw: string | null | undefined
): { iso2: string; digits: string } {
  if (!raw) return { iso2: "ID", digits: "" };

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

export default function ApplyFormModal({
  open,
  onClose,
  jobTitle,
  company,
}: Props) {
  const supabase = createClient();

  const [loadingProfile, setLoadingProfile] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState<string>("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [domicile, setDomicile] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("ID");

  // ==== PREFILL DARI SUPABASE SAAT MODAL DIBUKA ====
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
          .select("full_name, email, domicile, phone, linkedin, dob, photo_url")
          .eq("id", user.id)
          .single();

        if (error || !profile || cancelled) return;

        setPhoto(profile.photo_url ?? null);
        setFullName(profile.full_name ?? user.user_metadata?.full_name ?? "");
        setEmail(profile.email ?? user.email ?? "");
        setDomicile(profile.domicile ?? "");
        setLinkedin(profile.linkedin ?? "");
        setDob(profile.dob ?? "");

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

  const linkedinOk = useMemo(() => {
    if (!linkedin.trim()) return false;
    const r =
      /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9._%-]+\/?$/i;
    return r.test(linkedin.trim());
  }, [linkedin]);

  const phone = buildPhone(phoneCountry, phoneDigits);

  function onSubmit() {
    if (
      !photo ||
      !fullName.trim() ||
      !dob ||
      !domicile ||
      !phoneDigits.trim() ||
      !email.trim() ||
      !linkedin.trim()
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (!linkedinOk) {
      alert("Please enter a valid LinkedIn URL");
      return;
    }

    const payload = {
      jobTitle,
      company,
      fullName: fullName.trim(),
      dob,
      gender,
      domicile,
      phone,
      email: email.trim(),
      linkedin: linkedin.trim(),
      photo,
    };

    // Untuk sekarang: hanya alert detail data yang dikirim
    alert(`Submitting application:\n\n${JSON.stringify(payload, null, 2)}`);

    // TODO: nanti ganti dengan fetch ke API aplikasinya
    // console.log("Submitting...", payload);

    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex flex-col max-h-[calc(95vh-2rem)] max-w-[700px]"
    >
      {/* Header - Fixed */}
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
          {loadingProfile && (
            <span className="ml-1 text-[11px] text-teal-600">
              Loading your profile...
            </span>
          )}
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-0 md:px-8 pb-6">
        <div className="px-6 text-xs">
          {/* Photo */}
          <div className="mb-6 font-bold">
            <div className="text-red-500 mb-1">* Required</div>
            <div className="text-gray-700 mb-3 font-bold">Photo Profile</div>

            <PhotoCaptureField value={photo} onChange={setPhoto} />
          </div>

          {/* Full name */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Full name<span className="text-red-600">*</span>
            </span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full h-10 rounded-lg border border-gray-300 px-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-[#9E9E9E] text-[#404040]"
            />
          </label>

          {/* Date of birth */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Date of birth<span className="text-red-600">*</span>
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

          {/* Pronoun */}
          <fieldset className="mb-5">
            <legend className="block text-xs text-gray-700 mb-3 font-medium">
              Pronoun (gender)<span className="text-red-600">*</span>
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

          {/* Domicile */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Domicile<span className="text-red-600">*</span>
            </span>
            <DomicileSelect value={domicile} onChange={setDomicile} />
          </label>

          {/* Phone */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Phone number<span className="text-red-600">*</span>
            </span>
            <PhoneNumberInput
              value={phoneDigits}
              onChange={setPhoneDigits}
              country={phoneCountry}
              onCountryChange={(c: Country) => setPhoneCountry(c.iso2)}
            />
          </label>

          {/* Email */}
          <label className="block mb-5">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Email<span className="text-red-600">*</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full h-10 rounded-lg border border-gray-300 px-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm placeholder:text-[#9E9E9E] text-[#404040]"
            />
          </label>

          {/* LinkedIn */}
          <label className="block">
            <span className="block text-xs text-gray-700 mb-2 font-medium">
              Link LinkedIn<span className="text-red-600">*</span>
            </span>
            <LinkedInInput value={linkedin} onChange={setLinkedin} required />
          </label>
        </div>
      </div>

      {/* Submit Button - Sticky */}
      <div className="border-t border-gray-200 px-6 md:px-8 py-6">
        <button
          onClick={onSubmit}
          className="w-full rounded-lg bg-[#01959F] text-white font-semibold py-3 text-sm hover:bg-[#017A83] transition-colors"
        >
          Submit
        </button>
      </div>
    </Modal>
  );
}
