"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Brain, Target, TrendingUp, Code, Shield, Rocket, Sparkles, CheckCircle2, BarChart3, GitBranch } from "lucide-react";

const productPillars = [
  {
    title: "Autonomous Execution",
    body: "AI agents that learn, adapt, and execute complex workflows autonomously with human-in-the-loop controls",
    icon: Brain,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Enterprise Security",
    body: "Bank-grade encryption, compliance monitoring, and prompt injection defense across all operations",
    icon: Shield,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Business Intelligence",
    body: "Real-time dashboards with SLA tracking, cost analytics, and AI-driven optimization recommendations",
    icon: BarChart3,
    gradient: "from-purple-500 to-pink-500",
  },
] as const;

const proofGrid = [
  { label: "Workflows Orchestrated", value: "10k+", icon: "⚡" },
  { label: "Daily Executions", value: "2.4M", icon: "🚀" },
  { label: "Uptime SLA", value: "99.1%", icon: "✅" },
  { label: "Recovery Time", value: "<90s", icon: "💨" },
] as const;

const features = [
  {
    title: "AI-Powered Agents",
    desc: "Intelligent agents that make autonomous decisions and adapt in real-time",
    emoji: "🤖",
  },
  {
    title: "Real-Time Monitoring",
    desc: "Live dashboards with instant visibility into all workflow executions",
    emoji: "📊",
  },
  {
    title: "Workflow Automation",
    desc: "Build complex automation flows without writing code",
    emoji: "⚙️",
  },
  {
    title: "API-First Design",
    desc: "Seamless integration with your existing infrastructure",
    emoji: "🔌",
  },
  {
    title: "Scalable Infrastructure",
    desc: "Handle millions of tasks across distributed systems",
    emoji: "🌐",
  },
  {
    title: "Advanced Analytics",
    desc: "Deep insights with predictive analytics and anomaly detection",
    emoji: "📈",
  },
];

export default function Home(): JSX.Element {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-slate-900/95 backdrop-blur-sm shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-2xl font-bold z-10">
            <Zap className="text-blue-400" size={28} />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">Operon</span>
          </div>
          <div className="flex items-center space-x-8 z-10">
            <button onClick={() => router.push("/dashboard")} className="text-slate-300 hover:text-white transition-colors">Dashboard</button>
            <button onClick={() => router.push("/dashboard/workflows")} className="text-slate-300 hover:text-white transition-colors">Workflows</button>
            <button onClick={() => router.push("/auth/signin")} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">Sign In</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6 z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full w-fit">
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-sm text-blue-300">Next-Gen AI Automation Platform</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Intelligent
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 text-transparent bg-clip-text">Autonomous Agents</span>
              at Scale
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
              Empower your enterprise with AI-driven autonomous agents. Build, deploy, and manage complex workflows that learn and adapt in real-time.
            </p>
            <div className="flex gap-4 pt-4 flex-wrap">
              <button onClick={() => router.push("/auth/signin")} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
              <button className="px-8 py-4 border-2 border-slate-500 rounded-lg font-bold text-lg hover:border-slate-300 transition-all">
                Watch Demo
              </button>
            </div>
            <div className="flex gap-8 pt-8 flex-wrap">
              <div>
                <div className="text-3xl font-bold text-cyan-400">10K+</div>
                <div className="text-slate-400">Active Workflows</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">2.4M</div>
                <div className="text-slate-400">Daily Executions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">99.1%</div>
                <div className="text-slate-400">Uptime SLA</div>
              </div>
            </div>
          </div>

          {/* Animated agent visualization */}
          <div className="relative h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm border border-slate-700/50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-10 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={120} className="text-cyan-400 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Powerful Features for
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">Modern AI Systems</span>
            </h2>
            <p className="text-xl text-slate-400">Everything you need to build and manage intelligent agents</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {productPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${pillar.gradient} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{pillar.title}</h3>
                  <p className="text-slate-400">{pillar.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Packed with Advanced Capabilities</h2>
            <p className="text-slate-400">Everything you need for enterprise-scale automation</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-all hover:bg-slate-800/50">
                <div className="text-4xl mb-3">{feature.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6 z-10 bg-gradient-to-b from-transparent via-slate-800/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Enterprise Leaders</h2>
            <p className="text-slate-400">Proven performance at scale</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {proofGrid.map((item) => (
              <div key={item.label} className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 transition-all text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <p className="text-4xl font-bold text-cyan-400 mb-2">{item.value}</p>
                <p className="text-slate-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 text-transparent bg-clip-text">Enterprise with AI?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">Join enterprises worldwide already automating complex workflows with Operon</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push("/auth/signin")} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="px-8 py-4 border-2 border-slate-500 rounded-lg font-bold text-lg hover:border-slate-300 transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-700/50 py-12 px-6 bg-slate-900/50 z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-xl font-bold mb-4">
              <Zap className="text-blue-400" size={24} />
              <span>Operon</span>
            </div>
            <p className="text-slate-400">Enterprise AI Automation Platform</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <p className="hover:text-white cursor-pointer">Features</p>
              <p className="hover:text-white cursor-pointer">Pricing</p>
              <p className="hover:text-white cursor-pointer">Documentation</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <p className="hover:text-white cursor-pointer">About</p>
              <p className="hover:text-white cursor-pointer">Blog</p>
              <p className="hover:text-white cursor-pointer">Careers</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <p className="hover:text-white cursor-pointer">Privacy</p>
              <p className="hover:text-white cursor-pointer">Terms</p>
              <p className="hover:text-white cursor-pointer">Security</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Operon AI. Enterprise automation at scale.</p>
        </div>
      </footer>
    </main>
  );
}
