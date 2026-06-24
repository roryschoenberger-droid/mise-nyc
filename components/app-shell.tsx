import type { ReactNode } from "react";
import { SiteNav } from "./site-nav";

// Shared chrome for the in-app function pages: the top nav plus a centered
// content column.
export function AppShell({
  signedInViaOAuth,
  children,
}: {
  signedInViaOAuth: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteNav signedInViaOAuth={signedInViaOAuth} />
      <main className="mx-auto max-w-4xl space-y-12 px-6 pb-20 pt-12 sm:px-10 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
