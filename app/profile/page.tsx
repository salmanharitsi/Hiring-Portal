import { createServerSupabase } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=unauthenticated");

  const userMeta = (user.user_metadata ?? {}) as {
    full_name?: string;
    avatar_url?: string;
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, domicile, phone, linkedin, dob, photo_url"
    )
    .eq("id", user.id)
    .single();

  return (
    <ProfileClient
      avatarUrl={userMeta.avatar_url || ""}

      initial={{
        full_name: profile?.full_name ?? userMeta.full_name ?? "",
        email: profile?.email ?? user.email ?? "",
        domicile: profile?.domicile ?? "",
        phone: profile?.phone ?? "",
        linkedin: profile?.linkedin ?? "",
        dob: profile?.dob ?? "",
        photo_url: profile?.photo_url ?? null,
      }}
    />
  );
}