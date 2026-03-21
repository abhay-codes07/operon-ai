"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SignInForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsLoading(false);

    if (!result || result.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/60 focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500/30";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          placeholder="founder@company.com"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
          placeholder="Enter your password"
        />
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5">
          <p className="text-sm font-medium text-rose-400">{error}</p>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-sm text-slate-500">
        New to Operon?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Create your account
        </Link>
      </p>
    </form>
  );
}
