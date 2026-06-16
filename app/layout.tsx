import "./globals.css";
// The Flynet component theme. Import it once, at the root.
import "@flynetdev/react/styles.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { DevDrawer } from "../components/dev-drawer";
import { env } from "../lib/env";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mise",
  description: "Everything in its right place. Where restaurants find their people — and their next great collab.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
        {/* Developer onboarding drawer — dev builds only, never shipped to prod. */}
        {env.NODE_ENV !== "production" ? <DevDrawer /> : null}
      </body>
    </html>
  );
}
