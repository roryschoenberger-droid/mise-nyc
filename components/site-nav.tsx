"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

// Top navigation for the in-app pages: Home + the three function tabs, with the
// current tab highlighted. Logout shows only for real OAuth sessions.
const TABS = [
  { href: "/", label: "Home" },
  { href: "/my-challenges", label: "My Challenges" },
  { href: "/market", label: "Market Challenges" },
  { href: "/pitch", label: "Pitch an Idea" },
];

export function SiteNav({ signedInViaOAuth }: { signedInViaOAuth: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {TABS.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 font-medium text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        {signedInViaOAuth ? <LogoutButton href="/api/auth/logout" /> : null}
      </div>
    </nav>
  );
}
