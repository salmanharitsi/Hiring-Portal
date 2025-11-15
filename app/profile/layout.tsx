import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import { createServerSupabase } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoleProvider } from "./role-context";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const normalizedRole =
    (profile?.role ?? "applicant").toString().trim().toLowerCase();

  const role = normalizedRole === "admin" ? "admin" : "applicant";

  const items =
    role === "admin"
      ? [
          { label: "Job List", href: "/admin" },
          { label: "Candidates", href: "/admin/candidates" },
        ]
      : [
          { label: "Job List", href: "/applicant" },
          { label: "My Applications", href: "/applicant/my-applications" },
        ];

  return (
    <RoleProvider value={{ role, userId: user.id }}>
      <div className="min-h-dvh bg-white">
        <Navbar
          items={items}
          avatarUrl={user.user_metadata?.avatar_url ?? null}
          displayName={profile?.full_name ?? user.email}
        />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Footer />
      </div>
    </RoleProvider>
  );
}