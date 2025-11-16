"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function VerifyPageInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const q = sp.get("email");
    if (q) {
      setEmail(q);
      return;
    }
    try {
      const stored = sessionStorage.getItem("pendingEmail");
      if (stored) setEmail(stored);
    } catch {
      // ignore
    }
  }, [sp]);

  return (
    <div className="text-center flex flex-col items-center gap-2">
      <div className="space-y-1">
        <h1 className="text-[#404040] text-2xl font-bold">
          Periksa Email Anda
        </h1>
        <p className="text-xs text-[#4C4C4C]">
          Kami sudah mengirimkan link register ke{" "}
          <span className="font-bold">{email ?? ""}</span> yang berlaku dalam{" "}
          <span className="font-bold">30 menit</span>
        </p>
      </div>
      <Image
        src="/images/verify-vector.svg"
        alt="Verify Vector"
        width={184}
        height={184}
      />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageInner />
    </Suspense>
  );
}
