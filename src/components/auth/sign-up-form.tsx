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

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Create your workspace</h1>
        <p className="text-sm text-slate-600">Set up your organization and start deploying web agents.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          required
          value={formData.fullName}
          onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="Abhay Sharma"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="organizationName">
          Organization Name
        </label>
        <input
          id="organizationName"
          required
          value={formData.organizationName}
          onChange={(event) =>
            setFormData((current) => ({ ...current, organizationName: event.target.value }))
          }
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="TinyFish Labs"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Work Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="founder@tinyfish.ai"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          minLength={8}
          required
          value={formData.password}
          onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
          placeholder="Minimum 8 characters"
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-slate-900 underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
