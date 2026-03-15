"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import AnimatedShaderHero from "@/components/ui/animated-shader-hero";

const productPillars = [
  {
    title: "Execution Fabric",
    body: "Launch durable browser automations with queue-backed retries, replay, and real-time run control.",
  },
  {
    title: "Safety Layer",
    body: "Enforce approvals, sandbox identities, policy guardrails, and prompt-injection defense on every run.",
  },
  {
    title: "Business Intelligence",
    body: "Turn each workflow into an operating asset with SLA contracts, compliance artifacts, and FinOps telemetry.",
  },
] as const;

const proofGrid = [
  { label: "Workflows orchestrated", value: "10k+" },
  { label: "Execution events/day", value: "2.4M" },
  { label: "Median recovery time", value: "<90s" },
  { label: "Observed SLA reliability", value: "99.1%" },
] as const;

export default function Home(): JSX.Element {
  const router = useRouter();

  return (
    <main className="relative overflow-x-hidden">
      <AnimatedShaderHero
        trustBadge={{
          text: "Control plane for autonomous web operations",
          icons: ["◉"],
        }}
        headline={{
          line1: "Operate AI Agents",
          line2: "Like Production Systems",
        }}
        subtitle="Operon AI is where web agents are launched, governed, debugged, and optimized with enterprise-grade control."
        buttons={{
          primary: {
            text: "Launch Console",
            onClick: () => router.push("/dashboard"),
          },
          secondary: {
            text: "Create Workflow",
            onClick: () => router.push("/dashboard/workflows"),
          },
        }}
      />

      <section className="relative bg-slate-950 py-24 text-slate-100 section-fade-in">
        <AppShell className="relative z-10 space-y-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Why Teams Choose Operon</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">
              Built for operators managing real risk, not toy automations.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {productPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="glass-panel-dark rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{pillar.body}</p>
              </article>
            ))}
          </div>
        </AppShell>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-slate-100 to-white py-24 section-fade-in">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(56,189,248,0.14),transparent_30%)]" />
        <AppShell className="relative z-10 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Operational Proof</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 md:text-4xl">Visibility from trigger to business outcome.</h2>
            </div>
            <button
              onClick={() => router.push("/dashboard/activity")}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View Live Timeline
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {proofGrid.map((item) => (
              <div key={item.label} className="glass-panel rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1">
                <p className="text-3xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </AppShell>
      </section>
    </main>
  );
}
