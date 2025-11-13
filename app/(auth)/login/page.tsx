"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";
import Image from "next/image";

export default function LoginPage() {
  const supabase = createClient();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);
  const [msg, setMsg] = useState<ReactNode>(null);
  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const lastCheckedRef = useRef<string>("");
  const checkTokenRef = useRef(0);

  const origin = useMemo(
    () =>
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL || ""
        : window.location.origin,
    []
  );

  // Handle URL errors FIRST - before any other effect runs
  const urlError = sp.get("error");
  useEffect(() => {
    if (!urlError) return;

    const errors: Record<string, ReactNode> = {
      verification_link_expired:
        "Link login sudah kadaluwarsa. Silakan minta link baru.",
      unauthenticated: "Silakan login terlebih dahulu.",
      exchange_failed:
        "Gagal memproses login. Pastikan membuka link di browser yang sama saat kamu meminta link.",
      no_code: (
        <>
          Link <span className="font-bold">sudah kadaluarsa</span>, silahkan
          login kembali!
        </>
      ),
      callback_failed: "Terjadi kesalahan saat login.",
      server_error: "Pembuatan akun Google gagal di server. Coba lagi.",
      access_denied: "Akses Google ditolak.",
    };

    setMsg(errors[urlError] || "Terjadi kesalahan. Coba lagi.");
  }, [urlError]);

  useEffect(() => {
    const pf = sp.get("prefill");
    if (pf) setEmail(pf.toLowerCase().trim());
  }, [sp]);

  useEffect(() => {
    const urlError = sp.get("error");
    if (!urlError) {
      setMsg(null);
    }

    setExists(null);
    setChecking(false);

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setInvalid(null);
      return;
    }

    const t = setTimeout(async () => {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
      if (!ok) {
        setInvalid("Alamat email tidak valid");
        return;
      }
      setInvalid(null);

      if (lastCheckedRef.current === clean) return;

      setChecking(true);
      const myToken = ++checkTokenRef.current;
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("email", clean);

        if (myToken !== checkTokenRef.current) return;

        if (error) {
          setChecking(false);
          return;
        }

        lastCheckedRef.current = clean;
        setExists((count ?? 0) > 0);
        setChecking(false);
      } catch {
        if (myToken !== checkTokenRef.current) return;
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [email, supabase, sp]);

  const validateEmailNow = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  async function loginWithEmailMagic() {
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmailNow(cleanEmail)) {
      setInvalid("Alamat email tidak valid");
      return;
    }

    if (exists === false) {
      setMsg(
        <>
          <span>
            Email ini belum terdaftar sebagai akun di Rakamin Academy.
          </span>{" "}
          <a
            className="text-[#E11428] font-bold"
            href={`/register?prefill=${encodeURIComponent(
              cleanEmail
            )}&from=login_not_found`}
          >
            Daftar
          </a>
        </>
      );
      return;
    }

    setLoading(true);
    try {
      const { count, error: countErr } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("email", cleanEmail);

      if (countErr) {
        console.error("profiles count error:", countErr);
        setMsg("Terjadi kesalahan. Coba lagi.");
        setLoading(false);
        return;
      }

      if ((count ?? 0) === 0) {
        setMsg(
          <>
            <span>
              Email ini belum terdaftar sebagai akun di Rakamin Academy.
            </span>{" "}
            <a
              className="text-[#E11428] font-bold"
              href={`/register?prefill=${encodeURIComponent(
                cleanEmail
              )}&from=login_not_found`}
            >
              Daftar
            </a>
          </>
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setMsg(error.message || "Gagal mengirim link. Coba lagi.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("pendingEmail", cleanEmail);
      window.location.href = `/verify`;
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message || "Tidak bisa login dengan Google.");
      return;
    }
    if (data?.url) window.location.assign(data.url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Masuk ke Rakamin</h1>
        <p className="text-sm">
          Belum punya akun?{" "}
          <a href="/register" className="text-[#01959F] font-medium">
            Daftar menggunakan email
          </a>
        </p>
      </div>

      {msg && (
        <div className="text-xs text-[#E11428] border border-[#F5B1B7] bg-[#FFFAFA] rounded-sm py-0.5 text-center">
          {msg}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#404040]">Alamat email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=""
          autoComplete="email"
          className={`w-full h-10 rounded-lg border-2 px-3 outline-none transition ${
            invalid
              ? "border-[#E11428] bg-red-50"
              : "border-zinc-200 focus:border-[#01959F]"
          }`}
        />

        {/* Helper text real-time */}
        {invalid ? (
          <div className="flex items-center gap-2">
            <Image
              src="/icon/triangle-alert.svg"
              alt="Error Icon"
              width={16}
              height={16}
            />
            <p className="text-xs text-[#E11428]">{invalid}</p>
          </div>
        ) : email ? (
          <div className="text-xs">
            {checking ? (
              <span className="text-zinc-500">Memeriksa...</span>
            ) : exists === false ? (
              <span className="text-amber-600">Email belum terdaftar</span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                ✓ Email terdaftar
              </span>
            )}
          </div>
        ) : null}
      </div>

      <button
        onClick={loginWithEmailMagic}
        disabled={loading || checking}
        className="w-full h-10 rounded-lg bg-[#FBC037] hover:bg-[#fbb637] disabled:opacity-60 font-bold transform duration-300 cursor-pointer"
      >
        {loading ? "Mengirim..." : "Kirim link"}
      </button>

      <div className="flex items-center gap-3 text-xs text-[#9E9E9E]">
        <span className="h-px flex-1 bg-[#9E9E9E]" /> or{" "}
        <span className="h-px flex-1 bg-[#9E9E9E]" />
      </div>

      <button
        onClick={loginWithGoogle}
        disabled={loading}
        className="w-full py-2.5 rounded-lg border-2 border-[#EDEDED] hover:bg-zinc-50 disabled:opacity-60 text-zinc-800 font-bold text-sm flex items-center justify-center gap-3 cursor-pointer"
      >
        <Image
          src="/logo/logo-google.svg"
          alt="Google Logo"
          width={24}
          height={24}
        />
        Masuk dengan Google
      </button>
    </div>
  );
}
