"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      try {
        const hasCode = !!sp.get("code");
        const hasTokenHash = !!sp.get("token_hash");
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
            router.replace("/post-login");
          }
        });

        setTimeout(() => {
          subscription.unsubscribe();
          router.replace("/login?error=exchange_failed");
        }, 5000);
      } catch (e) {
        console.error("Auth callback error:", e);
        router.replace("/login?error=callback_failed");
      }
    };

    run();
  }, []);

  return <div className="p-6 text-sm text-zinc-600">Memproses login…</div>;
}
