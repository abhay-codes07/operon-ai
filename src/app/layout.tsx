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
            <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
              <AppShell className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                    W
                  </span>
                  <p className="text-sm font-semibold tracking-wide text-slate-900">
                    {siteConfig.name}
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  {siteConfig.tagline}
                </p>
              </AppShell>
            </header>
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
