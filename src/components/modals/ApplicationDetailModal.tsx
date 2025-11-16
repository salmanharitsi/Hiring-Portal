"use client";

import Image from "next/image";
import Modal from "./Modal";
import type {
  MyApplication,
  ApplicationStatus,
} from "@/app/(dashboard)/applicant/my-applications/page";

type Props = {
  open: boolean;
  onClose: () => void;
  application: MyApplication | null;
};

const statusBadgeClass = (st: ApplicationStatus) => {
  switch (st) {
    case "menunggu":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "diterima":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "ditolak":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-zinc-100 text-zinc-700 border border-zinc-200";
  }
};

export default function ApplicationDetailModal({
  open,
  onClose,
  application,
}: Props) {
  if (!open || !application) return null;

  const created = new Date(application.createdAt);
  const createdLabel = created.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const app = application;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[720px] w-full flex flex-col max-h-[calc(95vh-2rem)]"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-3 px-6 pt-6 pb-4 border-b border-zinc-200">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src={app.job.companyLogo ?? "/images/company-default.png"}
              alt={app.job.companyLogoAlt ?? app.job.company}
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex-1">
            <div className="text-xs text-zinc-500">{app.job.company}</div>
            <h2 className="text-base font-semibold text-[#1D1F20]">
              {app.job.title}
            </h2>
            <div className="text-xs text-zinc-500">
              {app.job.location} • {app.job.workMode}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(
              app.status
            )}`}
          >
            {app.status}
          </span>
          <span className="text-[11px] text-zinc-500">
            Diajukan pada {createdLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 text-sm text-[#1D1F20] space-y-6">
        {/* Job info */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <h3 className="text-md font-bold text-zinc-800 mb-2">
            Informasi Pekerjaan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-700">
            <div>
              <span className="text-zinc-500">Perusahaan</span>
              <div className="font-semibold">{app.job.company}</div>
            </div>
            <div>
              <span className="text-zinc-500">Lokasi</span>
              <div className="font-semibold">{app.job.location}</div>
            </div>
            <div>
              <span className="text-zinc-500">Tipe kerja</span>
              <div className="font-semibold">{app.job.jobType}</div>
            </div>
            <div>
              <span className="text-zinc-500">Level</span>
              <div className="font-semibold">{app.job.level}</div>
            </div>
          </div>
        </section>

        {/* Applicant info */}
        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <h3 className="text-md font-bold text-zinc-800 mb-2">
            Informasi Applicant
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs text-zinc-700">
            <div>
              <span className="text-zinc-500">Nama lengkap</span>
              <div className="font-semibold">{app.applicant.fullName}</div>
            </div>
            <div>
              <span className="text-zinc-500">Email</span>
              <div className="font-semibold break-all">{app.applicant.email}</div>
            </div>
            <div>
              <span className="text-zinc-500">Nomor telepon</span>
              <div className="font-semibold">{app.applicant.phone ?? "-"}</div>
            </div>
            <div>
              <span className="text-zinc-500">Tanggal lahir</span>
              <div className="font-semibold">{app.applicant.dob ?? "-"}</div>
            </div>
            <div>
              <span className="text-zinc-500">Domisili</span>
              <div className="font-semibold">{app.applicant.domicile ?? "-"}</div>
            </div>
            <div>
              <span className="text-zinc-500">Gender</span>
              <div className="font-semibold">{app.applicant.gender ?? "-"}</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-zinc-500">Link LinkedIn</span>
              <div className="font-semibold">
                {app.applicant.linkedin ? (
                  <a
                    href={app.applicant.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#01959F] hover:underline break-all"
                  >
                    {app.applicant.linkedin}
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-6 py-3 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}
