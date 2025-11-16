"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        let hasCode = false;
        let hasTokenHash = false;

        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          hasCode = !!sp.get("code");
          hasTokenHash = !!sp.get("token_hash");
        }

        if (!hasCode && !hasTokenHash) {
          router.replace("/login?error=no_code");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/post-login");
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (sess) {
            subscription.unsubscribe();
            if (timeoutId) clearTimeout(timeoutId);
            router.replace("/post-login");
          }
        });

        timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          router.replace("/login?error=exchange_failed");
        }, 5000);
      } catch (e) {
        console.error("Auth callback error:", e);
        router.replace("/login?error=callback_failed");
      }
    };

    run();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, supabase]);

  return <div className="p-6 text-sm text-zinc-600">Memproses login…</div>;
}
