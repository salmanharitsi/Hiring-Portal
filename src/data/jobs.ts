export type JobStatus = "active" | "inactive" | "draft";

export type ProfileRequirementStatus = "mandatory" | "optional" | "off";

export type ProfileRequirements = {
  full_name: ProfileRequirementStatus;
  photo: ProfileRequirementStatus;
  gender: ProfileRequirementStatus;
  domicile: ProfileRequirementStatus;
  email: ProfileRequirementStatus;
  phone: ProfileRequirementStatus;
  linkedin: ProfileRequirementStatus;
  dob: ProfileRequirementStatus;
};

export type WorkMode = "Onsite" | "Remote" | "Hybrid" | "Jarak Jauh";

export type Job = {
  id: string;
  title: string;
  status: JobStatus;
  startedOn: string;
  salaryMin: number | null;
  salaryMax: number | null;
  
  jobType: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  description: string[];
  candidatesNeeded: number;
  profileRequirements: ProfileRequirements;
  
  company: string;
  companyLogo: string;
  companyLogoAlt: string;
  location: string;
  postedAgo: string;
  workMode: WorkMode;
  level: string;
  tools?: string[];
  skills?: string[];
};

export const JOBS: Job[] = [
  {
    id: "1",
    title: "Frontend Engineer",
    status: "active",
    startedOn: "started on 1 Oct 2025",
    salaryMin: 7_500_000,
    salaryMax: 8_700_000,
    jobType: "Full-time",
    description: [
      "Anda akan mengembangkan fitur produk baru bersama insinyur backend dan manajer produk menggunakan metodologi Agile.",
      "Sebagai Product Engineer, kamu menulis kode yang bersih, efisien, dan meningkatkan pengalaman frontend produk secara bermakna.",
      "Kolaborasi dengan tim backend untuk menjembatani antarmuka pengguna dengan solusi backend yang scalable.",
    ],
    candidatesNeeded: 2,
    profileRequirements: {
      full_name: "mandatory",
      photo: "mandatory",
      gender: "mandatory",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "mandatory",
      dob: "mandatory",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Yogyakarta – Daerah Istimewa Yogyakarta",
    postedAgo: "11 jam yang lalu",
    workMode: "Jarak Jauh",
    level: "Pemula (0 - 3 tahun)",
    tools: ["TypeScript", "Playwright", "WebGL", "WebGPU"],
    skills: ["Javascript"],
  },
  {
    id: "2",
    title: "Data Analyst Intern",
    status: "active",
    startedOn: "started on 2 Oct 2025",
    salaryMin: null,
    salaryMax: null,
    jobType: "Internship",
    description: [
      "Membangun pipeline data end-to-end untuk menghasilkan insight yang dapat ditindaklanjuti.",
      "Membuat dashboard yang scalable dan mudah digunakan.",
      "Optimasi query SQL untuk performa ekstraksi data.",
    ],
    candidatesNeeded: 3,
    profileRequirements: {
      full_name: "mandatory",
      photo: "mandatory",
      gender: "optional",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "mandatory",
      dob: "optional",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "12 jam yang lalu",
    workMode: "Hybrid",
    level: "Pemula (0 - 3 tahun)",
    tools: ["Python", "Looker", "Spreadsheet/Google Sheet", "R"],
    skills: ["PostgreSQL"],
  },
  {
    id: "3",
    title: "Product Designer (UI/UX) Intern",
    status: "draft",
    startedOn: "started on 3 Sep 2025",
    salaryMin: null,
    salaryMax: null,
    jobType: "Internship",
    description: [
      "Ubah kebutuhan pengguna ke wireframe, flow, dan prototipe yang dapat diuji.",
      "Kolaborasi erat dengan engineer untuk implementasi pixel-perfect.",
      "Ikut riset pengguna & usability testing untuk iterasi solusi.",
    ],
    candidatesNeeded: 2,
    profileRequirements: {
      full_name: "mandatory",
      photo: "optional",
      gender: "optional",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "optional",
      dob: "off",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "2 hari yang lalu",
    workMode: "Jarak Jauh",
    level: "Pemula (0 - 2 tahun)",
    tools: ["Figma", "FigJam", "Framer"],
    skills: ["Design System", "Prototyping"],
  },
  {
    id: "4",
    title: "Backend Engineer",
    status: "active",
    startedOn: "started on 10 Sep 2025",
    salaryMin: 8_000_000,
    salaryMax: 11_000_000,
    jobType: "Full-time",
    description: [
      "Design and implement RESTful APIs dengan dokumentasi yang jelas.",
      "Implementasi sistem authentication dan authorization yang aman.",
      "Kolaborasi dengan frontend untuk integrasi yang seamless.",
    ],
    candidatesNeeded: 2,
    profileRequirements: {
      full_name: "mandatory",
      photo: "optional",
      gender: "off",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "optional",
      dob: "off",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "3 hari yang lalu",
    workMode: "Hybrid",
    level: "Mid-Level (2 - 4 tahun)",
    tools: ["Node.js", "PostgreSQL", "Docker", "AWS"],
    skills: ["API Design", "Authentication"],
  },
  {
    id: "5",
    title: "Business Development",
    status: "active",
    startedOn: "started on 18 Aug 2025",
    salaryMin: 9_500_000,
    salaryMax: 11_500_000,
    jobType: "Full-time",
    description: [
      "Identifikasi peluang kemitraan baru dan kelola pipeline end-to-end.",
      "Susun proposal & materi presentasi untuk pitching.",
      "Bekerja sama dengan tim produk & marketing untuk mencapai target growth.",
    ],
    candidatesNeeded: 1,
    profileRequirements: {
      full_name: "mandatory",
      photo: "optional",
      gender: "optional",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "mandatory",
      dob: "optional",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "5 hari yang lalu",
    workMode: "Hybrid",
    level: "Mid-Level (2 - 4 tahun)",
    tools: ["CRM", "Google Workspace"],
    skills: ["Negotiation", "Analytics"],
  },
  {
    id: "6",
    title: "QA Engineer",
    status: "inactive",
    startedOn: "started on 25 Jul 2025",
    salaryMin: 6_000_000,
    salaryMax: 9_000_000,
    jobType: "Full-time",
    description: [
      "Buat dan jalankan test case untuk manual dan automated testing.",
      "Identifikasi, dokumentasi, dan track bugs hingga resolved.",
      "Kolaborasi dengan developer untuk quality assurance.",
    ],
    candidatesNeeded: 1,
    profileRequirements: {
      full_name: "mandatory",
      photo: "optional",
      gender: "off",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "optional",
      dob: "off",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "1 minggu yang lalu",
    workMode: "Remote",
    level: "Pemula (1 - 3 tahun)",
    tools: ["Selenium", "Jest", "Postman"],
    skills: ["Test Automation", "Bug Tracking"],
  },
  {
    id: "7",
    title: "UI/UX Designer",
    status: "active",
    startedOn: "started on 5 Jul 2025",
    salaryMin: 7_500_000,
    salaryMax: 10_000_000,
    jobType: "Full-time",
    description: [
      "Design interface yang intuitive dan menarik untuk web dan mobile.",
      "Conduct user research dan usability testing.",
      "Maintain design system dan component library.",
    ],
    candidatesNeeded: 2,
    profileRequirements: {
      full_name: "mandatory",
      photo: "mandatory",
      gender: "optional",
      domicile: "mandatory",
      email: "mandatory",
      phone: "mandatory",
      linkedin: "mandatory",
      dob: "optional",
    },
    company: "Rakamin",
    companyLogo: "/logo/simple-logo-rakamin.svg",
    companyLogoAlt: "Rakamin Logo",
    location: "Kota Jakarta Selatan – DKI Jakarta",
    postedAgo: "2 minggu yang lalu",
    workMode: "Hybrid",
    level: "Mid-Level (2 - 4 tahun)",
    tools: ["Figma", "Adobe XD", "Principle"],
    skills: ["UI Design", "UX Research", "Prototyping"],
  },
];

// Helper function untuk format currency
export const toIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);