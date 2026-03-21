"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SignUpForm(): JSX.Element {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to create account");
      setIsLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsLoading(false);

    if (!loginResult || loginResult.error) {
      setError("Account created, but automatic sign-in failed. Please sign in manually.");
      router.push("/auth/sign-in");
      return;
    }

    router.push(loginResult.url ?? "/dashboard");
    router.refresh();
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/60 focus:bg-slate-800 focus:ring-1 focus:ring-cyan-500/30";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          required
          value={formData.fullName}
          onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
          className={inputClass}
          placeholder="Abhay Sharma"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="organizationName">
          Organization Name
        </label>
        <input
          id="organizationName"
          required
          value={formData.organizationName}
          onChange={(event) =>
            setFormData((current) => ({ ...current, organizationName: event.target.value }))
          }
          className={inputClass}
          placeholder="TinyFish Labs"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="email">
          Work Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
          className={inputClass}
          placeholder="founder@tinyfish.ai"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          minLength={8}
          required
          value={formData.password}
          onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          className={inputClass}
          placeholder="Minimum 8 characters"
        />
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5">
          <p className="text-sm font-medium text-rose-400">{error}</p>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  );
}
