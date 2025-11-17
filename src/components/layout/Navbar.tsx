"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/clients";
import Image from "next/image";

type NavItem = { label: string; href: string };

function Menus({
  items,
  activeHref,
  onItem,
}: {
  items: NavItem[];
  activeHref: string;
  onItem?: () => void;
}) {
  return (
    <>
      {items.map((it) => {
        const isActive = it.href === activeHref;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onItem}
            className={`px-3 py-2 font-semibold rounded-md transition block ${
              isActive
                ? "text-[#01959F] bg-[#E6F7F8]"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </>
  );
}

export default function Navbar({
  brandHref = "/applicant",
  brandLogo = "/logo/logo-rakamin.svg",
  items,
  avatarUrl,
  displayName,
  email,
}: {
  brandHref?: string;
  brandLogo?: string;
  items: NavItem[];
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);

  const [derivedEmail, setDerivedEmail] = useState<string | null>(
    email ?? null
  );

  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(
    avatarUrl ?? null
  );
  const [resolvedName, setResolvedName] = useState<string>(
    displayName?.trim() || "User"
  );

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const metadata = (user.user_metadata ?? {}) as {
          avatar_url?: string;
          full_name?: string;
          email?: string;
        };

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, role, photo_url")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        const roleFromDb = (profile?.role as string | undefined) ?? null;

        setUserRole(roleFromDb);

        const nameFromProfile = profile?.full_name;
        const nameFromMeta = metadata.full_name;
        const fallbackName =
          displayName ?? user.email ?? metadata.email ?? email ?? "User";

        const safeResolvedName = (
          nameFromProfile ||
          nameFromMeta ||
          fallbackName ||
          "User"
        ).trim();

        setResolvedName(safeResolvedName);

        const resolvedEmail =
          email ?? profile?.email ?? user.email ?? metadata.email ?? null;
        setDerivedEmail(resolvedEmail);

        let finalAvatar: string | null = null;

        if (roleFromDb === "admin") {
          finalAvatar = metadata.avatar_url ?? avatarUrl ?? null;
        } else {
          finalAvatar = profile?.photo_url ?? null;
        }

        setResolvedAvatar(finalAvatar);
      } catch {
        // fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, email, avatarUrl, displayName]);

  // ==== Inisial & warna background ====
  const safeName = resolvedName.trim() || "User";

  const initials = useMemo(() => {
    const parts = safeName.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return safeName.slice(0, 2).toUpperCase();
  }, [safeName]);

  const avatarBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 75% 85%)`;
  }, [safeName]);

  const activeHref = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
    return (
      sorted.find(
        (it) => pathname === it.href || pathname.startsWith(it.href + "/")
      )?.href ?? pathname
    );
  }, [items, pathname]);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProfileOpen(true);
  };
  const closeWithDelay = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setProfileOpen(false), 150);
  };

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!profileOpen) return;
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-zinc-100 shadow-md">
      <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
        {/* Brand */}
        <Link href={brandHref} className="flex items-center gap-2">
          <Image src={brandLogo} alt="Rakamin" width={128} height={28} />
        </Link>

        {/* Desktop menus */}
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Menus items={items} activeHref={activeHref} />
        </nav>

        {/* Right cluster */}
        <div className="relative flex items-center gap-2">
          {/* Hamburger (mobile only) */}
          {userRole === "applicant" && (
            <button
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-zinc-200 hover:bg-zinc-50"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="#374151"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Avatar + dropdown */}
          <div
            ref={ddRef}
            className="relative flex"
            onMouseEnter={openNow}
            onMouseLeave={closeWithDelay}
          >
            <button
              className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-zinc-200"
              aria-label="User menu"
              onClick={() => (profileOpen ? setProfileOpen(false) : openNow())}
            >
              {resolvedAvatar ? (
                <Image
                  src={resolvedAvatar}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full grid place-items-center text-[11px] font-semibold"
                  style={{ background: avatarBg }}
                >
                  {initials}
                </div>
              )}
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-zinc-200 bg-white shadow-lg p-0 overflow-hidden"
                onMouseEnter={openNow}
                onMouseLeave={closeWithDelay}
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-zinc-200">
                    {resolvedAvatar ? (
                      <Image
                        src={resolvedAvatar}
                        alt="avatar"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center text-xs font-semibold"
                        style={{ background: avatarBg }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-extrabold tracking-wide text-zinc-800 uppercase">
                      {safeName}
                    </div>
                    {derivedEmail ? (
                      <div className="text-xs text-zinc-500 truncate max-w-54">
                        {derivedEmail}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="h-px bg-zinc-100" />

                {/* Items */}
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 hover:bg-[#E6F7F8] hover:text-[#01959F] transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="flex-none stroke-current opacity-70 group-hover:opacity-100"
                  >
                    <path d="M4 5h16v14H4z" fill="none" strokeWidth="1.6" />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.6"
                      fill="none"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M7.5 17c1.2-2 3-3 4.5-3s3.3 1 4.5 3"
                      fill="none"
                      strokeWidth="1.6"
                    />
                  </svg>
                  <span>Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-[#E6F7F8] hover:text-[#01959F] transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="flex-none stroke-current opacity-70 group-hover:opacity-100"
                  >
                    <path
                      d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"
                      fill="none"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M14 16l4-4-4-4M8 12h10"
                      fill="none"
                      strokeWidth="1.6"
                    />
                  </svg>
                  <span>Logout</span>
                </button>

                <div className="px-3 py-2">
                  <div className="text-[10px] text-zinc-400">V.0001</div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu panel */}
          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-0 sm:hidden"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 sm:hidden z-10 w-56 rounded-lg border border-zinc-200 bg-white shadow-md p-2">
                <Menus
                  items={items}
                  activeHref={activeHref}
                  onItem={() => setMenuOpen(false)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
