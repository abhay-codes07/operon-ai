<div align="center">

![TinyFish Hackathon 2026](https://img.shields.io/badge/TinyFish_Hackathon_2026-Submission-22d3ee?style=for-the-badge&labelColor=040611)
![Mind2Web Accuracy](https://img.shields.io/badge/Mind2Web_Accuracy-89.9%25-22d3ee?style=for-the-badge&labelColor=040611)
![Next.js 14](https://img.shields.io/badge/Next.js_14-App_Router-000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

# Operon AI

**The web is now programmable.**

Operon is an enterprise-grade autonomous web agent platform powered by [TinyFish AI](https://tinyfish.ai). Deploy fleets of parallel agents that navigate, extract, and act across any website — with full observability, security, and learning built in.

[Live Demo](https://operon-ai.vercel.app) · [Dashboard](https://operon-ai.vercel.app/dashboard) · [GitHub](https://github.com/abhay-codes07/operon-ai)

</div>

---

## Why Operon

|  | Operon / TinyFish | OpenAI Operator | Claude Computer Use | Browser Use |
|---|---|---|---|---|
| **Mind2Web Accuracy** | **89.9%** | 61.3% | 56.3% | 30.0% |
| **Easy→Hard Degradation** | **−15.6 pts** | −39 pts | −45 pts | −58 pts |
| **Parallel Agents** | **1,000** | 1 | 1 | 1 |
| **Cost / operation** | **$0.015** | ~$0.08 | ~$0.12 | varies |

TinyFish holds up under compound-error multi-step scenarios where every other tool collapses. Operon is the management layer that makes those capabilities production-grade.

---

## Features

### 🌊 Swarm Orchestration *(new — unique)*
Launch fleets of parallel TinyFish agents across multiple target sites simultaneously from a single command. A live swarm dashboard shows every agent's real-time status in a grid. Results aggregate automatically when all agents report back — cross-site intelligence in seconds, not hours.

```bash
POST /api/internal/swarm/launch
{ "agentId": "...", "workflowId": "...", "targetUrls": ["amazon.com", "ebay.com", "walmart.com"] }
```

### 👁 Sentinel Watchlist *(new — unique)*
Deploy always-on sentinel agents that monitor specific URLs on a schedule. Unlike dumb DOM diffing, sentinels use Claude AI to determine if a change is **semantically meaningful** — then auto-generate an intelligence briefing: *"Amazon renamed their Prime tier and added a new upsell step to checkout. Your workflow selector needs updating."*

### 🧬 Agent DNA Transfer *(new — unique)*
After each successful execution, Operon extracts a **behavioral fingerprint** — the exact action sequence, selector patterns, and timing that worked. This DNA is stored and transferable to new agents, giving them near-instant first-run success. A visual DNA helix shows pattern confidence per step.

### 🔴 Real-Time SSE Execution Stream
Live execution events stream from the BullMQ worker to your browser via Server-Sent Events — no extra WebSocket server. Auto-closes when execution reaches terminal status.

### 📸 Screenshot Gallery
TinyFish execution screenshots stored at each agent step, viewable in a full-screen gallery with keyboard navigation.

### 🧠 NL Workflow Builder
Describe a task in plain English → Claude Haiku decomposes it into a complete `WorkflowDefinition` JSON with target URL, cron schedule, guardrails, timeout, and step breakdown.

### 📧 Execution Alerts
Email + Slack notifications on every execution completion, with branded dark-theme email that includes price comparison tables parsed from the agent output.

### 📊 Agent Performance Leaderboard
Side-by-side reliability ranking: composite score (success rate × 0.6, retry penalty × 0.2, failure frequency × 0.15, latency × 0.05), color-coded score bars, avg execution duration.

### 🛡 Operon Shield
Runtime prompt injection defense — every agent action scanned before execution. Pattern-matched injections blocked (riskScore ≥ 70) with full threat telemetry timeline.

### 🔧 Self-Healing Selectors
Semantic fallback when target selectors fail. Tries `data-testid`, `aria-label`, and fuzzy similarity scoring. All resolutions stored with strategy and confidence score.

### 🏥 Failure Root Cause Analysis
Automated failure classification (`SELECTOR_DRIFT`, `NAVIGATION_FAILURE`, `AUTHENTICATION_ISSUE`, `PAGE_LOAD_TIMEOUT`) from logs, failed steps, and DOM snapshots.

### 🔁 Deterministic Replay
Every execution step recorded with DOM snapshot — enabling step-by-step time-travel debugging.

### 🧑‍✈️ Human-in-the-Loop Co-Pilot
When agent confidence drops below threshold, execution pauses. Operators review the ghost-cursor preview and approve or override — then step resumes autonomously.

### 🚀 Mission Control
Fleet-level incident detection with automated runbook execution across `SELECTOR_ERROR_LOOP`, `FAILURE_SPIKE`, and `RETRY_LOOP` patterns.

### 📈 FinOps Intelligence
Per-run cost tracking (browser runtime + LLM tokens + self-healing), monthly aggregation, anomaly detection, and per-workflow budget enforcement.

### ✅ Compliance Passport
Full audit trail of every agent action with plain-English compliance summary via Claude. Violation detection with configurable thresholds.

### 🕹 Canary Releases
Progressive rollout for workflow definition changes with automatic rollback on failure threshold breach.

### 🔬 Sandbox Identities
Isolated synthetic personas for testing — disposable credentials, isolated session state, blast-radius scoring.

### 🏪 OperonHub Marketplace
Publish, discover, and install reusable workflow templates with versioning and one-click installation.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js 14 App                      │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  App Router  │  │  API Routes │  │  NextAuth   │  │
│  │  (RSC + CC)  │  │  80+ routes │  │  RBAC       │  │
│  └──────────────┘  └─────────────┘  └─────────────┘  │
└───────────────────────────┬──────────────────────────┘
                            │ BullMQ jobs
          ┌─────────────────▼──────────────────┐
          │         Execution Worker            │
          │    tinyfish-execution-runner.ts      │
          │  ┌──────────────────────────────┐  │
          │  │   TinyFish Web Agent API     │  │
          │  │   (SSE streaming response)   │  │
          │  └──────────────────────────────┘  │
          │  Shield · Self-Healing · FinOps     │
          │  Compliance · DNA · Alerts · Replay  │
          └──────────────────┬─────────────────┘
                             │
          ┌──────────────────▼─────────────────┐
          │       PostgreSQL (Prisma)           │
          │       50+ models · migrations       │
          └────────────────────────────────────┘
```

**Key patterns:**
- **Server Components** for dashboard data fetching — zero client-side API overhead
- **BullMQ Worker** as a separate process (`npm run worker:dev`)
- **SSE** via `/api/internal/executions/[id]/sse` — no WebSocket server required
- **Repository pattern** — services → repositories → Prisma

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| Auth | NextAuth.js v4 |
| Web Agents | TinyFish Web Agent API |
| LLM | Anthropic Claude (Haiku 4.5) |
| Billing | Stripe |
| Email Alerts | Nodemailer (SMTP) |
| Deployment | Docker + docker-compose |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)
- TinyFish API key — [get one free](https://tinyfish.ai)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com) *(optional)*

### 1. Clone & install
```bash
git clone https://github.com/abhay-codes07/operon-ai.git
cd operon-ai
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, TINYFISH_API_KEY, NEXTAUTH_SECRET
```

### 3. Start infrastructure
```bash
docker-compose up -d   # PostgreSQL on :5433, Redis on :6379
```

### 4. Set up database
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Run the app
```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — BullMQ execution worker (REQUIRED for agents to execute)
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seed credentials from `.env`.

---

## Environment Variables

See [`.env.example`](.env.example) for the full annotated reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `TINYFISH_API_KEY` | ✅ | TinyFish Web Agent API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (port 5433 in docker-compose) |
| `REDIS_URL` | ✅ | Redis connection string |
| `NEXTAUTH_SECRET` | ✅ | 32-byte random secret |
| `ANTHROPIC_API_KEY` | optional | Powers NL workflow builder + sentinel briefings |
| `SMTP_HOST` + `ALERT_EMAIL_TO` | optional | Email alerts on execution completion |
| `SLACK_WEBHOOK_URL` | optional | Slack notifications on execution completion |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # 20+ dashboard pages
│   │   ├── swarm/          # Swarm Orchestrator
│   │   ├── sentinels/      # Sentinel Watchlist
│   │   ├── agents/         # Agent registry + leaderboard
│   │   ├── activity/       # Execution timeline + detail
│   │   ├── workflows/      # Workflow builder
│   │   ├── shield/         # Prompt injection defense
│   │   └── ...
│   ├── api/internal/       # 80+ API routes
│   └── page.tsx            # Landing page
├── components/
│   ├── dashboard/
│   │   ├── swarm/          # SwarmCanvas, SwarmLaunchForm
│   │   ├── sentinels/      # SentinelGrid, AddSentinelModal
│   │   └── activity/       # AgentDnaPanel, ExecutionOutputViewer, ...
│   └── ui/                 # Button, Card, SectionHeading, ...
├── server/
│   ├── services/           # Business logic
│   │   ├── executions/     # tinyfish-execution-runner.ts (core)
│   │   ├── notifications/  # execution-alert-service.ts
│   │   └── sentinels/      # sentinel-service.ts
│   ├── integrations/tinyfish/  # client, request-builder, response-parser
│   └── queue/              # BullMQ producers + workers
├── lib/                    # shield, finops, compliance, sla, copilot, ...
└── config/                 # Navigation, env schema

prisma/
├── schema.prisma           # 50+ models
└── migrations/

worker/                     # BullMQ worker entry point (separate process)
```

---

## Hackathon & Accelerator

Built for the **[TinyFish Hackathon 2026](https://www.hackerearth.com/challenges/hackathon/the-tiny-fish-hackathon-2026/)** — submission deadline March 29, 2026.

**Three novel features designed to win:**

1. **Swarm Orchestration** — Direct showcase of TinyFish's 1,000 concurrent agent capability. No other hackathon project will have a real-time visual grid of parallel agents across multiple websites.

2. **Semantic Sentinel Watchlist** — Turns agents from one-shot tools into persistent web intelligence infrastructure. The LLM "is this change meaningful?" layer is the differentiator.

3. **Agent DNA Transfer** — Genuine autonomous learning beyond key-value memory. Behavioral fingerprints that make agents smarter with every run.

Also applying for the **[TinyFish Accelerator](https://tinyfish.ai/accelerator)** — Operon is B2B infrastructure for enterprises deploying autonomous web agents at scale, which is precisely the Mango Capital / TinyFish investment thesis.

---

## License

MIT

---

<div align="center">
  <p>Built on <a href="https://tinyfish.ai">TinyFish AI</a> · Powered by Anthropic Claude · TinyFish Hackathon 2026</p>
</div>
