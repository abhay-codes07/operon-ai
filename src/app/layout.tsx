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
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
