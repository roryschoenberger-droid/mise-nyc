import "./globals.css";
// The Flynet component theme. Import it once, at the root.
import "@flynetdev/react/styles.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { DM_Sans, Pinyon_Script } from "next/font/google";
import { DevDrawer } from "../components/dev-drawer";
import { env } from "../lib/env";

const dmSans = DM_Sans({ subsets: ["latin"] });
// Display script for the "Challenge Hub" wordmark — Pinyon Script, a free formal
// copperplate close to the requested "Haypenny"-style script (the real one is a
// commercial font we'd need the file for). Exposed as --font-display.
const displayFont = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Challenge Hub",
  description:
    "Create dining challenges, discover market-wide events, and reward your guests in $FLY.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} ${displayFont.variable}`}>
        {children}
        {/* Developer onboarding drawer — dev builds only, never shipped to prod. */}
        {env.NODE_ENV !== "production" ? <DevDrawer /> : null}
      </body>
    </html>
  );
}
