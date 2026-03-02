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

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Sign in to WebOps AI</h1>
        <p className="text-sm text-slate-600">Manage your autonomous agents and execution workflows.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="founder@company.com"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="Enter your password"
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-sm text-slate-600">
        New to WebOps AI?{" "}
        <Link href="/auth/sign-up" className="font-medium text-slate-900 underline-offset-2 hover:underline">
          Create your account
        </Link>
      </p>
    </form>
  );
}
