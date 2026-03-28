"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Shield,
  Brain,
  Eye,
  Layers,
  BarChart3,
  ChevronRight,
  Globe,
  Cpu,
  Activity,
  TrendingUp,
  CheckCircle,
  Play,
} from "lucide-react";

// Fake live agent activity ticker
const tickerItems = [
  { agent: "Agent-7f2a", action: "Extracted pricing data", site: "amazon.com", status: "success", ms: 841 },
  { agent: "Agent-3b9c", action: "Navigated checkout flow", site: "shopify.com", status: "success", ms: 1203 },
  { agent: "Agent-1d4e", action: "Scraped job listings", site: "linkedin.com", status: "success", ms: 692 },
  { agent: "Agent-9k1m", action: "Monitored competitor price", site: "bestbuy.com", status: "success", ms: 449 },
  { agent: "Agent-5f8p", action: "Verified invoice status", site: "netsuite.com", status: "success", ms: 1876 },
  { agent: "Agent-2q7r", action: "Filed compliance form", site: "sec.gov", status: "success", ms: 3102 },
  { agent: "Agent-8t3v", action: "Aggregated market signals", site: "yahoo.finance.com", status: "success", ms: 567 },
  { agent: "Agent-4w9x", action: "Monitored regulatory change", site: "federalregister.gov", status: "success", ms: 2341 },
];

const capabilities = [
  {
    icon: Layers,
    label: "Swarm Orchestration",
    desc: "Launch 100s of parallel agents simultaneously across any website",
    color: "from-cyan-500 to-blue-600",
    badge: "NEW",
  },
  {
    icon: Eye,
    label: "Sentinel Watchlist",
    desc: "AI tripwires that detect semantically meaningful web changes",
    color: "from-violet-500 to-purple-600",
    badge: "NEW",
  },
  {
    icon: Brain,
    label: "Agent DNA Transfer",
    desc: "Behavioral fingerprints that let agents inherit proven patterns",
    color: "from-emerald-500 to-teal-600",
    badge: "NEW",
  },
  {
    icon: Shield,
    label: "Operon Shield",
    desc: "Runtime prompt injection defense for every agent execution",
    color: "from-rose-500 to-pink-600",
    badge: null,
  },
  {
    icon: BarChart3,
    label: "FinOps Intelligence",
    desc: "Cost analytics, anomaly detection, and per-run budget enforcement",
    color: "from-amber-500 to-orange-600",
    badge: null,
  },
  {
    icon: Activity,
    label: "Live SSE Stream",
    desc: "Real-time execution telemetry streamed directly to your dashboard",
    color: "from-sky-500 to-cyan-600",
    badge: null,
  },
];

const benchmarks = [
  { name: "Operon / TinyFish", score: 89.9, color: "bg-cyan-500", highlight: true },
  { name: "OpenAI Operator", score: 61.3, color: "bg-slate-600", highlight: false },
  { name: "Claude Computer Use", score: 56.3, color: "bg-slate-700", highlight: false },
  { name: "Browser Use", score: 30.0, color: "bg-slate-800", highlight: false },
];

const steps = [
  {
    n: "01",
    title: "Describe in Plain English",
    body: "Tell your agent what to do. No selectors, no scripts. Just a goal.",
  },
  {
    n: "02",
    title: "Agents Execute in Parallel",
    body: "TinyFish-powered agents fan out across target sites simultaneously.",
  },
  {
    n: "03",
    title: "Structured Intelligence Returns",
    body: "Clean JSON, screenshots, and AI-authored briefings arrive in seconds.",
  },
  {
    n: "04",
    title: "Agents Learn & Improve",
    body: "DNA Transfer means every run makes the next one smarter.",
  },
];

// Animated agent nodes for hero visual
const agentNodes = [
  { cx: 50, cy: 50, r: 18, delay: 0 },
  { cx: 20, cy: 25, r: 10, delay: 0.4 },
  { cx: 80, cy: 20, r: 12, delay: 0.8 },
  { cx: 85, cy: 75, r: 9, delay: 1.2 },
  { cx: 15, cy: 75, r: 11, delay: 1.6 },
  { cx: 50, cy: 10, r: 7, delay: 2.0 },
  { cx: 92, cy: 48, r: 8, delay: 2.4 },
  { cx: 5, cy: 50, r: 8, delay: 2.8 },
];

const connections = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
];

function TickerLine({ item }: { item: typeof tickerItems[0] }) {
  return (
    <span className="inline-flex items-center gap-3 px-6 text-sm whitespace-nowrap">
      <span className="font-mono text-cyan-400/70 text-xs">{item.agent}</span>
      <span className="text-slate-400">{item.action}</span>
      <span className="text-slate-600">on</span>
      <span className="text-slate-300 font-medium">{item.site}</span>
      <span className="text-emerald-400 text-xs">+{item.ms}ms</span>
      <span className="text-slate-700 mx-2">·</span>
    </span>
  );
}

export default function Home(): JSX.Element {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [tickOffset, setTickOffset] = useState(0);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTickOffset((prev) => prev - 1);
    }, 30);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const repeatedTicker = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <main className="relative overflow-x-hidden bg-[#040611] text-white selection:bg-cyan-500/30">

      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/5 rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet-500/5 rounded-full filter blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-200 ${isScrolled ? "bg-[#040611]/95 backdrop-blur-md border-b border-slate-800/60" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-white">Operon</span>
            <span className="text-cyan-400">AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <button onClick={() => router.push("/dashboard")} className="hover:text-white transition-colors">Product</button>
            <button onClick={() => router.push("/dashboard/workflows")} className="hover:text-white transition-colors">Workflows</button>
            <a href="https://docs.tinyfish.ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/auth/sign-in")} className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5">
              Sign in
            </button>
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 rounded-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 z-10">
        {/* Badge */}
        <div className="mb-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Built on TinyFish · 89.9% Mind2Web accuracy · Hackathon 2026
        </div>

        <h1 className="text-center font-bold leading-[1.05] tracking-tight mb-6">
          <span className="block text-5xl md:text-7xl lg:text-8xl text-white">The Web Is Now</span>
          <span className="block text-5xl md:text-7xl lg:text-8xl bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 text-transparent bg-clip-text">
            Programmable
          </span>
        </h1>

        <p className="text-center text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Operon deploys autonomous AI agents that navigate, extract, and act across any website — in parallel, at scale, with enterprise-grade observability.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <button
            onClick={() => router.push("/auth/sign-up")}
            className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-base hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-all"
          >
            Start building free
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="flex items-center gap-2 px-7 py-3.5 bg-slate-900 border border-slate-700/80 rounded-xl font-semibold text-base text-slate-300 hover:border-slate-500 hover:text-white transition-all"
          >
            <Play size={15} className="text-cyan-400" />
            View live demo
          </button>
        </div>

        {/* Agent network SVG visualization */}
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm overflow-hidden p-6">
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-slate-500 font-mono">operon swarm — 7 agents active</span>
            </div>
            <svg viewBox="0 0 100 100" className="w-full h-48" style={{ overflow: "visible" }}>
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Connection lines */}
              {connections.map(([from, to], i) => {
                const a = agentNodes[from ?? 0] ?? agentNodes[0];
                const b = agentNodes[to ?? 0] ?? agentNodes[0];
                if (!a || !b) return null;
                return (
                  <line
                    key={i}
                    x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                    stroke="rgba(34,211,238,0.15)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                );
              })}
              {/* Nodes */}
              {agentNodes.map((node, i) => (
                <g key={i}>
                  <circle
                    cx={node.cx} cy={node.cy} r={node.r + 4}
                    fill="rgba(34,211,238,0.05)"
                    style={{
                      animation: `pulse ${2 + node.delay * 0.3}s ease-in-out infinite`,
                      animationDelay: `${node.delay}s`,
                    }}
                  />
                  <circle
                    cx={node.cx} cy={node.cy} r={node.r}
                    fill={i === 0 ? "rgba(34,211,238,0.2)" : "rgba(30,41,59,0.9)"}
                    stroke={i === 0 ? "rgba(34,211,238,0.8)" : "rgba(34,211,238,0.3)"}
                    strokeWidth={i === 0 ? "1" : "0.5"}
                  />
                  {i === 0 && (
                    <text x={node.cx} y={node.cy + 4} textAnchor="middle" fontSize="8" fill="#22d3ee" fontWeight="bold">
                      HUB
                    </text>
                  )}
                  {i !== 0 && (
                    <text x={node.cx} y={node.cy + 3} textAnchor="middle" fontSize="5" fill="rgba(148,163,184,0.8)">
                      A{i}
                    </text>
                  )}
                </g>
              ))}
              {/* Animated signal pulses */}
              {connections.slice(0, 4).map(([_from, _to], i) => {
                return (
                  <circle key={i} r="1.5" fill="#22d3ee" opacity="0.8">
                    <animateMotion
                      dur={`${1.5 + i * 0.4}s`}
                      repeatCount="indefinite"
                      begin={`${i * 0.6}s`}
                    >
                      <mpath xlinkHref={`#path-${i}`} />
                    </animateMotion>
                  </circle>
                );
              })}
            </svg>
            {/* Live status row */}
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              {agentNodes.slice(1, 6).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-slate-500">agent-{i + 1}</span>
                  <span className="text-xs text-emerald-400/70">running</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER ── */}
      <div className="relative z-10 border-y border-slate-800/60 bg-slate-900/30 overflow-hidden py-3">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#040611] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#040611] to-transparent z-10 pointer-events-none" />
        <div
          className="flex"
          style={{ transform: `translateX(${tickOffset % 2000}px)`, transition: "none" }}
        >
          {repeatedTicker.map((item, i) => (
            <TickerLine key={i} item={item} />
          ))}
        </div>
      </div>

      {/* ── BENCHMARK ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 p-8">
            <div className="flex items-start justify-between gap-8 flex-wrap mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">Performance Benchmark</p>
                <h2 className="text-3xl font-bold text-white">Mind2Web · 300 tasks · 136 live sites</h2>
                <p className="text-slate-400 mt-2">The most rigorous real-world web agent benchmark</p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-bold text-cyan-400">89.9%</p>
                <p className="text-sm text-slate-400">overall success rate</p>
              </div>
            </div>
            <div className="space-y-3">
              {benchmarks.map((b) => (
                <div key={b.name} className="flex items-center gap-4">
                  <div className="w-36 text-right text-sm text-slate-400 shrink-0">{b.name}</div>
                  <div className="flex-1 h-6 bg-slate-800/60 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${b.color} rounded-lg transition-all duration-1000 flex items-center justify-end pr-3`}
                      style={{ width: `${b.score}%` }}
                    >
                      <span className={`text-xs font-bold ${b.highlight ? "text-[#040611]" : "text-slate-300"}`}>
                        {b.score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-600">Source: TinyFish Mind2Web evaluation, 2025. Only 15.6-point drop from easy→hard tasks vs 39–58 points for competitors.</p>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Platform Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Every layer an agent needs
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From single-shot tasks to swarm orchestration, Operon handles the full lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.label}
                  className="group relative rounded-xl border border-slate-700/60 bg-slate-900/60 p-6 hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cap.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${cap.color} flex items-center justify-center`}>
                        <Icon size={19} className="text-white" />
                      </div>
                      {cap.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold tracking-widest">
                          {cap.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{cap.label}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">How It Works</p>
            <h2 className="text-4xl font-bold text-white">From goal to intelligence in seconds</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-0">
            {steps.map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center px-4 pb-8">
                {i < steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-px bg-gradient-to-r from-cyan-500/40 to-transparent hidden md:block" />
                )}
                <div className="relative z-10 h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                  <span className="text-xs font-bold text-cyan-400">{step.n}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP-DIVE: Swarm ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400 mb-6">
              <Layers size={12} />
              Swarm Orchestration
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              One command.<br />Hundreds of agents.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Launch a fleet of parallel TinyFish agents across any number of target sites simultaneously. Watch them execute in real-time on a live grid, then receive aggregated intelligence when the last agent reports back.
            </p>
            <ul className="space-y-3">
              {["Fan out to 100+ URLs in a single API call", "Live swarm dashboard with per-agent SSE streams", "Unified intelligence aggregation on completion", "Zero queue contention — true parallel execution"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle size={15} className="text-cyan-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="mt-8 flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Try Swarm Orchestrator <ChevronRight size={16} />
            </button>
          </div>
          {/* Swarm grid mockup */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
            <div className="text-xs text-slate-500 font-mono mb-3">swarm://run-7f2a · 6 agents · 4 succeeded</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { url: "amazon.com", status: "SUCCEEDED", ms: "841ms" },
                { url: "ebay.com", status: "SUCCEEDED", ms: "1.2s" },
                { url: "walmart.com", status: "SUCCEEDED", ms: "692ms" },
                { url: "bestbuy.com", status: "RUNNING", ms: "..." },
                { url: "target.com", status: "SUCCEEDED", ms: "449ms" },
                { url: "newegg.com", status: "RUNNING", ms: "..." },
              ].map((agent) => (
                <div key={agent.url} className={`rounded-lg border p-3 text-xs ${
                  agent.status === "SUCCEEDED"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}>
                  <div className={`font-semibold mb-1 ${agent.status === "SUCCEEDED" ? "text-emerald-400" : "text-amber-400"}`}>
                    {agent.status === "SUCCEEDED" ? "✓" : "⟳"} {agent.url}
                  </div>
                  <div className="text-slate-500 font-mono">{agent.ms}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg bg-slate-800/60 text-xs">
              <p className="text-slate-400 mb-1">Aggregated results ready:</p>
              <p className="text-cyan-400 font-mono">→ Best price: $899 on walmart.com</p>
              <p className="text-cyan-400 font-mono">→ Stock available: 4/6 sites</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP-DIVE: Sentinels ── */}
      <section className="relative z-10 py-24 px-6 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Sentinel card mockup */}
          <div className="order-2 lg:order-1 space-y-3">
            {[
              {
                url: "amazon.com/pricing",
                status: "CHANGE_DETECTED",
                lastCheck: "12 min ago",
                briefing: "Prime membership tier renamed to 'Prime Core'. Checkout flow gained a new upsell step. Likely A/B test targeting conversion rate. Your checkout workflow requires selector update.",
              },
              {
                url: "linkedin.com/jobs",
                status: "WATCHING",
                lastCheck: "2 hrs ago",
                briefing: null,
              },
              {
                url: "federalregister.gov",
                status: "WATCHING",
                lastCheck: "6 hrs ago",
                briefing: null,
              },
            ].map((s) => (
              <div key={s.url} className={`rounded-xl border p-4 text-sm ${
                s.status === "CHANGE_DETECTED"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-slate-700/60 bg-slate-900/40"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.status === "CHANGE_DETECTED" ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                    <span className="font-mono text-slate-300 text-xs">{s.url}</span>
                  </div>
                  <span className="text-xs text-slate-600">{s.lastCheck}</span>
                </div>
                {s.briefing && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20">
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      <span className="font-semibold text-amber-400">Intelligence: </span>{s.briefing}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400 mb-6">
              <Eye size={12} />
              Sentinel Watchlist
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              AI tripwires on<br />any web page.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Deploy always-on sentinel agents that monitor URLs on a schedule. Unlike dumb DOM diffing, Operon sentinels use LLM reasoning to decide whether a change is <em className="text-white not-italic font-medium">semantically meaningful</em> — then generate an AI intelligence briefing about what changed and why it matters to your workflows.
            </p>
            <ul className="space-y-3">
              {["Semantic change detection — not byte diffing", "AI-authored intelligence briefings on every change", "Automatic workflow update suggestions", "Hourly, daily, or custom cron schedules"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle size={15} className="text-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "89.9%", label: "Mind2Web accuracy", icon: TrendingUp, color: "text-cyan-400" },
            { value: "1,000", label: "Parallel agents", icon: Layers, color: "text-blue-400" },
            { value: "$0.015", label: "Per step at scale", icon: BarChart3, color: "text-emerald-400" },
            { value: "<1s", label: "Avg response time", icon: Cpu, color: "text-violet-400" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 text-center">
                <Icon size={20} className={`${stat.color} mx-auto mb-3`} />
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── POWERED BY ── */}
      <section className="relative z-10 py-12 px-6 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6">Powered by & integrates with</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["TinyFish AI", "PostgreSQL", "Redis / BullMQ", "Next.js", "Vercel", "TypeScript"].map((tech) => (
              <span key={tech} className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-default">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400 mb-8">
            <Globe size={12} />
            TinyFish Hackathon 2026 · Submission ready
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            The web is your<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">database.</span>
          </h2>
          <p className="text-slate-400 text-xl mb-10 leading-relaxed">
            Every page, every portal, every SaaS app — now accessible to your agents as structured data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/auth/sign-up")}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-[0_0_60px_rgba(34,211,238,0.3)] transition-all"
            >
              Start for free
              <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              href="/auth/sign-in"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 border border-slate-700/80 rounded-xl font-bold text-lg text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-slate-800/60 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg mb-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Zap size={12} className="text-white" />
                </div>
                <span>Operon AI</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs">Autonomous web agent infrastructure for enterprises and builders.</p>
            </div>
            <div className="grid grid-cols-3 gap-12 text-sm">
              <div>
                <p className="text-white font-semibold mb-3">Product</p>
                <div className="space-y-2 text-slate-500">
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Swarm</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Sentinels</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Shield</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Pricing</p>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Developers</p>
                <div className="space-y-2 text-slate-500">
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Docs</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">API</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">GitHub</p>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Company</p>
                <div className="space-y-2 text-slate-500">
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">About</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Blog</p>
                  <p className="hover:text-slate-300 cursor-pointer transition-colors">Twitter</p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-600">
            <p>© 2026 Operon AI. Built for the TinyFish Hackathon 2026.</p>
            <p>Powered by TinyFish Web Agent API · 89.9% Mind2Web accuracy</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </main>
  );
}
