"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showLogo = pathname !== "/verify";

  return (
    <main className="min-h-dvh grid place-items-center bg-[#FAFAFA] text-[#1D1F20] p-6">
      <div className="w-full max-w-[500px] flex flex-col gap-6">
        {showLogo && (
          <Image src="/logo/logo-rakamin.svg" alt="Rakamin Logo" width={145} height={50} />
        )}
        <section className="rounded-lg border border-zinc-100 bg-white shadow-xs p-10">
          {children}
        </section>
      </div>
    </main>
  );
}
