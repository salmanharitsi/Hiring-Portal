import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import { createServerSupabase } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ApplicantLayout({
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

  if (profile?.role !== "applicant") redirect("/admin");

  return (
    <div className="min-h-dvh bg-white">
      <Navbar
        items={[
          { label: "Job List", href: "/applicant" },
          { label: "My Applications", href: "/applicant/my-applications" },
        ]}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
        displayName={profile?.full_name ?? user.email}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
