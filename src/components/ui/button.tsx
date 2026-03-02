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
      return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    case "ghost":
      return "bg-transparent text-slate-700 hover:bg-slate-100";
    case "primary":
    default:
      return "bg-slate-900 text-white hover:bg-slate-800";
  }
}

const baseClassName =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

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
