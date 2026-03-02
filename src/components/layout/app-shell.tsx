import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps): JSX.Element {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6 md:px-10", className)}>{children}</div>
  );
}
