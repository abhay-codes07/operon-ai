import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { siteConfig } from "@/config/site";

import { AppProviders } from "./providers";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <AppProviders>
          <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-50 border-b border-white/25 bg-white/30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/15">
              <AppShell className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-sm font-bold text-white shadow-sm">
                    O
                    <span className="pointer-events-none absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-amber-400/90 blur-sm" />
                  </span>
                  <p className="text-sm font-semibold tracking-wide text-slate-900">
                    {siteConfig.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="hidden text-xs font-medium uppercase tracking-[0.16em] text-slate-500 md:block">
                    {siteConfig.tagline}
                  </p>
                  <a
                    href="/dashboard"
                    className="inline-flex h-9 items-center rounded-lg border border-white/35 bg-white/35 px-3 text-xs font-semibold text-slate-800 transition hover:border-white/60 hover:bg-white/50"
                  >
                    Open Console
                  </a>
                </div>
              </AppShell>
            </header>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
