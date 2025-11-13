"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";

export default function PostLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkRoleAndRedirect() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login?error=unauthenticated");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/applicant");
        }
      } catch (error) {
        console.error("Post-login error:", error);
        router.push("/login?error=redirect_failed");
      }
    }

    checkRoleAndRedirect();
  }, [supabase, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-zinc-600">Mengalihkan...</p>
      </div>
    </div>
  );
}
