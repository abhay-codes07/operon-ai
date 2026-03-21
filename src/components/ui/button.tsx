import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type CommonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type AnchorButtonProps = CommonProps & {
  href: string;
};

type NativeButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

function getVariantClass(variant: ButtonVariant): string {
  switch (variant) {
    case "secondary":
      return "border border-slate-700/60 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white";
    case "ghost":
      return "bg-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent hover:border-slate-700/50";
    case "primary":
    default:
      return "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:from-cyan-400 hover:to-blue-500";
  }
}

const baseClassName =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: NativeButtonProps): JSX.Element {
  return (
    <button className={cn(baseClassName, getVariantClass(variant), className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
}: AnchorButtonProps): JSX.Element {
  return (
    <Link href={href} className={cn(baseClassName, getVariantClass(variant), className)}>
      {children}
    </Link>
  );
}
