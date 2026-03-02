"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps): JSX.Element {
  return <SessionProvider>{children}</SessionProvider>;
}
