# Hiring Portal

A modern hiring platform that connects candidates and hiring teams through a responsive, enterprise-grade web interface.  
It covers the full flow from job discovery and application submission to admin-side job and candidate management.

---

## Tech Stack

**Framework / Client**

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

**State & Data**

- Supabase (PostgreSQL + Auth + RLS)
- Local/derived React state

**API & Backend**

- Supabase Database & Auth
- Next.js Route Handlers for custom endpoints

**Webcam & Computer Vision**

- MediaPipe Hands (`@mediapipe/hands`, `@mediapipe/camera_utils`) for in-browser hand pose detection

**Utilities / UX**

- `sonner` for toast notifications
- `date-fns` for date formatting and manipulation
- `react-day-picker` for calendar/date input

---

## Features

### Authentication & Authorization

- Passwordless login using **magic link** via Supabase Auth.
- **Google Single Sign-On (SSO)** for frictionless authentication.
- Role-aware layouts:
  - **Applicant** dashboard for candidates.
  - **Admin** dashboard for the hiring team.
- Guarded routes to prevent unauthorized access to admin-only areas.

> Autentikasi mengimplementasikan login dengan magic link dan Google SSO menggunakan Supabase.

---

### Applicant Experience

- **Job listing & search**
  - Responsive job list with search by job title.
  - Clear empty state when no jobs are available.
- **Job application flow**
  - Apply to a job directly from the applicant dashboard.
  - Each job defines **minimum profile requirements**:
    - Full name, photo, gender, domicile, email, phone, LinkedIn, date of birth.
  - Validation ensures the profile fulfills these requirements before an application can be submitted.
- **Profile management**
  - Dedicated profile page to edit personal data used in applications.
  - Domicile selector powered by a prebuilt JSON dataset.
  - Date-of-birth picker using `react-day-picker`.
  - Real-time validation with descriptive error messages and toasts.

---

### Hand Pose Detection for Photo Capture

- Integrated webcam capture on the profile page.
- Uses **MediaPipe Hands** to detect a valid hand pose in real time.
- The system only captures a photo when the expected pose is detected, providing:
  - Consistent, high-quality captured images.
  - A seamless, guided experience for users.
- Graceful fallback:
  - Clear error toasts if camera permission is denied or initialization fails.

> Fitur **Hand Pose Detection** yang seamless untuk proses pengambilan foto secara langsung dari browser.

---

### Admin Experience

- **Job management**
  - Create, edit, and delete job openings.
  - Configure:
    - Title, job type, level, location, work mode.
    - Salary range (minimum & maximum).
    - Number of candidates needed.
    - Tools & skills tags.
    - Per-field **profile requirement flags** (mandatory / optional / off).
  - Toggle job status (active / inactive / draft) with optimistic UI and toast feedback.
- **Candidate management per job**
  - Dedicated **Manage Candidate** page for each job.
  - Responsive table with:
    - Dynamic columns based on profile requirements (only show relevant fields).
    - Candidate status badge (`menunggu`, `diterima`, `ditolak`).
  - Bulk actions to accept or reject multiple candidates at once.
  - Thoughtful loading and empty states with illustrations.

---

### UX, Design & Error Handling

- Enterprise-grade UI considerations:
  - Smooth spacing and consistent paddings across breakpoints.
  - Predictable modal behavior and scrolling in complex forms.
  - Consistent focus, hover, and disabled states on interactive elements.
- Robust validation & error handling:
  - Client-side validation for required fields and numeric inputs (salary, total candidates).
  - Clear toast messages on success and failure for all critical operations.
  - Fallback UIs for:
    - Failed data fetching.
    - No job openings.
    - No candidates for a given job.
- Performance-friendly:
  - Simple, predictable React state management.
  - Server-side Supabase queries where appropriate.
  - Avoids unnecessary re-renders in large tables and forms.

---

## Demo

> Replace with your deployment URL or demo video.

```text
https://your-demo-url-here.com
```

---

## Run Locally

1. Clone the project

```bash
  git clone https://github.com/salmanharitsi/Hiring-Portal.git
```

2. Go to the project directory

```bash
  cd hiring-portal
```

3. Install dependencies

```bash
  npm install
```

4. Configure environment variables

```bash
  touch .env.local
```

Add the required Supabase environment variables (adapt names to match your createClient / createServerSupabase helpers):

```bash
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

  # Optional: if you use this on the server
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

  # Used for auth redirects & magic link deep links
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Start the server

```bash
  npm run dev
```
