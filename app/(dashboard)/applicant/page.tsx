"use client";

import ApplyFormModal from "@/src/components/modals/ApplyFormModal";
import Image from "next/image";
import { useMemo, useState } from "react";

type WorkMode = "Onsite" | "Remote" | "Hybrid" | "Jarak Jauh";
type Employment = "Magang" | "Kontrak" | "Penuh Waktu" | "Paruh Waktu";

type Job = {
  id: string;
  company: string;
  companyLogo: string;
  companyLogoAlt: string;
  title: string;
  location: string;
  postedAgo: string;
  workMode: WorkMode;
  employmentType: Employment;
  level: string;
  minSalary?: number;
  maxSalary?: number;
  tools?: string[];
  skills?: string[];
  description: string[];
};

const toIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const badgeWorkMode = (m: WorkMode) => {
  switch (m) {
    case "Onsite":
      return "bg-orange-50 text-orange-800";
    case "Remote":
    case "Jarak Jauh":
      return "bg-sky-50 text-sky-800";
    case "Hybrid":
      return "bg-emerald-50 text-emerald-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

const badgeEmployment = (e: Employment) => {
  switch (e) {
    case "Magang":
      return "bg-cyan-50 text-cyan-800 font-bold";
    case "Kontrak":
      return "bg-fuchsia-50 text-fuchsia-800";
    case "Penuh Waktu":
      return "bg-lime-50 text-lime-800";
    case "Paruh Waktu":
      return "bg-amber-50 text-amber-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
};

const JOBS: Job[] = [
  {
    id: "1",
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    title: "Frontend Engineer",
    location: "Kota Yogyakarta – Daerah Istimewa Yogyakarta",
    postedAgo: "11 jam yang lalu",
    workMode: "Jarak Jauh",
    employmentType: "Penuh Waktu",
    level: "Pemula (0 - 3 tahun)",
    minSalary: 7_500_000,
    maxSalary: 8_700_000,
    tools: ["TypeScript", "Playwright", "WebGL", "WebGPU"],
    skills: ["Javascript"],
    description: [
      "Anda akan mengembangkan fitur produk baru bersama insinyur backend dan manajer produk menggunakan metodologi Agile.",
      "Sebagai Product Engineer, kamu menulis kode yang bersih, efisien, dan meningkatkan pengalaman frontend produk secara bermakna.",
      "Kolaborasi dengan tim backend untuk menjembatani antarmuka pengguna dengan solusi backend yang scalable.",
    ],
  },
  {
    id: "2",
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    title: "Data Analyst Intern",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "12 jam yang lalu",
    workMode: "Hybrid",
    employmentType: "Magang",
    level: "Pemula (0 - 3 tahun)",
    tools: ["Python", "Looker", "Spreadsheet/Google Sheet", "R"],
    skills: ["PostgreSQL"],
    description: [
      "Membangun pipeline data end-to-end untuk menghasilkan insight yang dapat ditindaklanjuti.",
      "Membuat dashboard yang scalable dan mudah digunakan.",
      "Optimasi query SQL untuk performa ekstraksi data.",
    ],
  },
  {
    id: "3",
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    title: "Product Designer (UI/UX) Intern",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "2 hari yang lalu",
    workMode: "Jarak Jauh",
    employmentType: "Magang",
    level: "Pemula (0 - 2 tahun)",
    tools: ["Figma", "FigJam", "Framer"],
    skills: ["Design System", "Prototyping"],
    description: [
      "Ubah kebutuhan pengguna ke wireframe, flow, dan prototipe yang dapat diuji.",
      "Kolaborasi erat dengan engineer untuk implementasi pixel-perfect.",
      "Ikut riset pengguna & usability testing untuk iterasi solusi.",
    ],
  },
  {
    id: "4",
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    title: "Business Development",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "3 hari yang lalu",
    workMode: "Hybrid",
    employmentType: "Penuh Waktu",
    level: "Mid-Level (2 - 4 tahun)",
    minSalary: 9_500_000,
    maxSalary: 11_500_000,
    tools: ["CRM", "Google Workspace"],
    skills: ["Negotiation", "Analytics"],
    description: [
      "Identifikasi peluang kemitraan baru dan kelola pipeline end-to-end.",
      "Susun proposal & materi presentasi untuk pitching.",
      "Bekerja sama dengan tim produk & marketing untuk mencapai target growth.",
    ],
  },
  {
    id: "5",
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    title: "Frontend Engineer Intern",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "5 hari yang lalu",
    workMode: "Remote",
    employmentType: "Magang",
    level: "Pemula (0 - 1 tahun)",
    tools: ["Next.js", "Tailwind CSS", "Supabase"],
    skills: ["TypeScript", "Web Performance"],
    description: [
      "Bangun komponen UI reusable & accessible di React/Next.js.",
      "Integrasi API yang andal dan aman.",
      "Performa: code-splitting, caching, dan optimasi rendering.",
    ],
  },
];

export default function ApplicantHomePage() {
  const [activeId, setActiveId] = useState<string>(JOBS[0].id);
  const activeJob = useMemo(
    () => JOBS.find((j) => j.id === activeId)!,
    [activeId]
  );
  const [showApply, setShowApply] = useState(false);

  const salaryRange =
    activeJob.minSalary && activeJob.maxSalary
      ? `${toIDR(activeJob.minSalary)} - ${toIDR(activeJob.maxSalary)}`
      : activeJob.minSalary
      ? toIDR(activeJob.minSalary)
      : undefined;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 text-[#404040]">
        {/* LEFT LIST */}
        <aside className="space-y-5 max-h-[calc(60dvh-140px)] md:max-h-[calc(100dvh-140px)] overflow-auto pr-1">
          {JOBS.map((job) => {
            const isActive = job.id === activeId;
            const listSalary =
              job.minSalary && job.maxSalary
                ? `${toIDR(job.minSalary)} - ${toIDR(job.maxSalary)}`
                : job.minSalary
                ? toIDR(job.minSalary)
                : null;

            return (
              <button
                key={job.id}
                onClick={() => setActiveId(job.id)}
                className={[
                  "w-full text-left border shadow-sm rounded-lg p-4 transition shadow-sm/0 hover:shadow-sm",
                  isActive
                    ? "border-[#01777F] bg-[#F7FEFF] border-2"
                    : "border-zinc-200 bg-white hover:border-[#01777F]/50",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={job.companyLogo}
                    alt={job.companyLogoAlt}
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{job.title}</div>
                    <div className="text-xs text-zinc-500">{job.company}</div>
                    <span className="ml-auto text-zinc-400 text-[11px]">
                      {job.postedAgo}
                    </span>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-zinc-600">
                        <Image
                          src="/icon/location-point.svg"
                          alt="Location Icon"
                          width={14}
                          height={14}
                        />
                        {job.location.split(" – ")[0]}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${badgeEmployment(
                          job.employmentType
                        )}`}
                      >
                        {job.employmentType}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${badgeWorkMode(
                          job.workMode
                        )}`}
                      >
                        {job.workMode}
                      </span>
                    </div>

                    {listSalary && (
                      <div className="inline-flex items-center gap-1 text-zinc-600 mt-2">
                        <Image
                          src="/icon/money.svg"
                          alt="Location Icon"
                          width={14}
                          height={14}
                        />
                        <div className="text-xs">{listSalary}</div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT DETAIL */}
        <section className="border border-zinc-200 rounded-lg p-6 bg-white">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex items-start gap-3">
              <Image
                src={activeJob.companyLogo}
                alt={activeJob.companyLogoAlt}
                width={36}
                height={36}
              />
              <div className="min-w-0">
                <div className="text-sm text-zinc-500">{activeJob.company}</div>
                <h1 className="text-xl font-bold">{activeJob.title}</h1>
                <div className="text-sm text-zinc-500">
                  {activeJob.location} • {activeJob.workMode}
                </div>
              </div>
            </div>
            <div className="ml-auto w-full md:w-auto">
            <button
              className="rounded-md bg-[#FBC037] shadow-md px-4 py-1 font-bold hover:brightness-95 w-full text-sm cursor-pointer"
              onClick={() => setShowApply(true)}
              type="button"
            >
              Apply
            </button>
            </div>
          </div>

          <hr className="my-5 border-zinc-200" />

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${badgeEmployment(
                activeJob.employmentType
              )}`}
            >
              {activeJob.employmentType}
            </span>
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-full ${badgeWorkMode(
                activeJob.workMode
              )}`}
            >
              {activeJob.level}
            </span>
          </div>

          {(activeJob.minSalary || activeJob.maxSalary) && (
            <div className="mt-5 flex items-center gap-2 text-zinc-700">
              <Image
                src="/icon/money.svg"
                alt="Location Icon"
                width={17}
                height={17}
              />
              <span className="font-medium">{salaryRange}</span>
            </div>
          )}

          {(activeJob.tools?.length || activeJob.skills?.length) && (
            <>
              <h3 className="mt-6 font-bold">Alat</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeJob.tools?.map((t) => (
                  <span
                    key={t}
                    className="rounded-md font-semibold text-xs bg-sky-50 px-2 py-1 text-sky-800"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {activeJob.skills && activeJob.skills.length > 0 && (
                <>
                  <h3 className="mt-6 font-bold">Kompetensi</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeJob.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md font-semibold bg-amber-50 px-2 py-1 text-xs text-amber-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <h3 className="mt-6 font-bold">Deskripsi</h3>
          <div className="mt-2 space-y-3 text-sm text-zinc-700">
            {activeJob.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>

      <ApplyFormModal
        open={showApply}
        onClose={() => setShowApply(false)}
        jobTitle={activeJob.title}
        company={activeJob.company}
      />
    </>
  );
}
