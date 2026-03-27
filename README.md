<div align="center">

<br/>

```
 ██████╗ ██████╗ ███████╗██████╗  ██████╗ ███╗   ██╗
██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗████╗  ██║
██║   ██║██████╔╝█████╗  ██████╔╝██║   ██║██╔██╗ ██║
██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║
╚██████╔╝██║     ███████╗██║  ██║╚██████╔╝██║ ╚████║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

### The web is now programmable.

[![TinyFish Hackathon 2026](https://img.shields.io/badge/TinyFish_Hackathon_2026-Submission-22d3ee?style=for-the-badge&labelColor=040611)](https://www.hackerearth.com/challenges/hackathon/the-tiny-fish-hackathon-2026/)
[![Mind2Web Accuracy](https://img.shields.io/badge/Mind2Web_Accuracy-89.9%25-10b981?style=for-the-badge&labelColor=040611)](https://tinyfish.ai)
[![Build](https://img.shields.io/badge/Build-Passing-22d3ee?style=for-the-badge&labelColor=040611)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Zero_Errors-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js_14-App_Router-000?style=for-the-badge&logo=next.js)](#)

<br/>

**Operon** is an autonomous web agent platform built on [TinyFish AI](https://tinyfish.ai).
Deploy fleets of parallel agents that watch, extract, and act across any website —
with full observability, intelligence, and control built in.

[**Live Demo**](https://operon-ai.vercel.app) · [**Dashboard**](https://operon-ai.vercel.app/dashboard) · [**GitHub**](https://github.com/abhay-codes07/operon-ai)

</div>

---

## Why TinyFish beats everything else

<div align="center">

| | **Operon / TinyFish** | OpenAI Operator | Claude Computer Use | Browser Use |
|:--|:--:|:--:|:--:|:--:|
| **Mind2Web Accuracy** | **89.9%** | 61.3% | 56.3% | 30.0% |
| **Easy → Hard Degradation** | **−15.6 pts** | −39 pts | −45 pts | −58 pts |
| **Parallel Agents** | **1,000** | 1 | 1 | 1 |
| **Cost / step** | **$0.015** | ~$0.08 | ~$0.12 | varies |

*TinyFish holds accuracy on compound multi-step tasks where every other tool collapses.*

</div>

---

## What Operon Does That Nothing Else Can

### SnapBuy — Autonomous Deal Sniper
> *"Set it. Forget it. Own it."*

Every other price tool sends you an alert. **SnapBuy completes the purchase.** Set a trigger condition in plain English — "price drops below $899", "GPU back in stock", "visa appointment slot opens". A TinyFish agent watches the URL. The instant the condition is met, it navigates, fills your saved payment details, and finishes checkout. Order confirmation in your inbox before you even see the notification.

```
trigger: "RTX 5090 back in stock at Best Buy"
action:  "add to cart, apply coupons, checkout with saved card"
result:  Order #BB-2847291 confirmed ✓
```

---

### Heartbeat — Synthetic User Monitoring
> *"Does your product still work? Find out before your users do."*

Define your product's critical flows in plain English. Every 15 minutes, a TinyFish agent acts as a real user going through them: sign up, checkout, create a project, invite a teammate. If anything breaks — a button doesn't render, a form errors out, a page is blank — you get an alert with a screenshot of exactly what failed and at which step. Not HTTP 200 checks. **Visual, human-accuracy, UI-level monitoring.**

```
journey: "New User Signup → Onboarding → First Agent Created"
status:  Step 3 FAILED — "Stripe form did not render within 8s"
alert:   Sent 19 minutes ago with screenshot evidence
```

---

### PriceWatch — Price Drop Intelligence
> *"Never pay full price again."*

Add any product from any retailer. Set your target price. TinyFish checks it on your schedule — hourly, every 6 hours, daily. The moment the price drops below your threshold, you get an instant email + Slack notification with a direct link. Sparkline price history so you can see the trend. Lowest-ever price shown so you know if it's actually a deal.

```
watching: Sony WH-1000XM5 on Amazon  ($279 → alert at $249)
history:  $349 → $329 → $299 → $279 → ... → 🔔 $249
```

---

### EthicsWatch — Real-Time ESG & Ethics Intelligence
> *"Know when organizations change their commitments. Before the market does."*

Hedge funds, policymakers, NGOs, and compliance teams monitor organizations for changes in ESG standards, corporate social responsibility commitments, new regulations, governance policies, and supply chain ethics. TinyFish agents scrape corporate CSR pages, SEC EDGAR filings, regulatory body announcements, and UN SDG databases. **Claude analyzes whether a change is materially significant** — you get a briefing, not a raw diff.

```
monitor: SEC climate disclosure rules
alert:   CRITICAL — "SEC finalized Scope 1+2 GHG reporting for all large filers"
impact:  "Every public company must update 10-K filings. Non-compliance = material misstatement."
```

---

### Swarm Orchestration — Fleet at Scale
One command launches parallel agents across multiple URLs simultaneously. Live status grid. Results aggregate automatically when all agents report back.

```bash
POST /api/internal/swarm/launch
{ "targetUrls": ["amazon.com", "ebay.com", "walmart.com", "bestbuy.com"] }
# → 4 agents running in parallel right now
```

---

### Sentinel Watchlist — Semantic Change Detection
Deploy always-on agents monitoring specific URLs on a schedule. Unlike DOM diffing, Claude determines if a change is **semantically meaningful** and generates an intelligence briefing: *"Amazon renamed their Prime tier and added a new upsell step to checkout — your selector needs updating."*

---

### Agent DNA Transfer — Behavioral Fingerprinting
After each successful execution, Operon extracts a behavioral fingerprint — exact action sequences, selector patterns, timing confidence — and makes it transferable to new agents. Near-instant first-run success. No warmup.

---

### Recon — Autonomous Security Scanner
Six TinyFish agents simultaneously scan a target domain: admin panel exposure, sensitive file disclosure (`.env`, `.git/config`), login error enumeration, directory listings, unauthenticated API endpoints, missing security headers. Severity-rated findings in minutes.

---

### Pulse — Competitive Intelligence Engine
Monitor any competitor domain with 3 parallel agents: pricing tiers, hiring signals (8 ML engineers hired = new AI feature in 90 days), feature page changes. Claude synthesizes a battle card: their weaknesses, your advantages, a recommended counter.

---

### DataMesh — Web-to-JSON Extraction API
Public REST API. Define a schema. Get structured data from any URL.

```bash
curl -X POST https://your-operon.vercel.app/api/v1/extract \
  -H "x-api-key: op_live_xxxx" \
  -d '{"url":"amazon.com/product/...", "schema":{"price":"number","title":"string"}}'
# → {"data":{"price":979.99,"title":"Apple iPhone 16 Pro"}, "confidence":0.96}
```

---

### Results Hub — Unified Output Dashboard
Every execution result in one place — prices, jobs, extracted data, structured output. Smart preview auto-detects result type. Auto-refreshes every 3 seconds while agents are active.

---

### More Built-In

| Feature | What it does |
|---------|-------------|
| **Real-Time SSE** | Live execution events stream to browser — no WebSocket server needed |
| **NL Workflow Builder** | Describe a task in English → Claude builds the full workflow definition |
| **Agent Leaderboard** | Composite reliability ranking: success rate, retry penalty, latency |
| **Operon Shield** | Prompt injection defense — injections scoring ≥70 blocked before execution |
| **Self-Healing Selectors** | Semantic fallback: tries `data-testid`, `aria-label`, fuzzy similarity |
| **Failure RCA** | Auto-classifies failures: `SELECTOR_DRIFT`, `AUTH_ISSUE`, `PAGE_LOAD_TIMEOUT` |
| **Co-Pilot** | Human-in-the-loop — agent pauses for operator approval when confidence drops |
| **Mission Control** | Fleet-level incident detection + automated runbook execution |
| **FinOps** | Per-run cost tracking, anomaly detection, per-workflow budget enforcement |
| **Compliance Passport** | Full audit trail + plain-English compliance summary via Claude |
| **Canary Releases** | Progressive rollout with automatic rollback on failure threshold |
| **Screenshot Gallery** | Visual proof-of-work — every step captured with keyboard navigation |

---

## Architecture

```
╔══════════════════════════════════════════════════════════╗
║                     Next.js 14 App                        ║
║  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ║
║  │ App Router  │   │  90+ API     │   │  NextAuth    │   ║
║  │ RSC + CC    │   │  Routes      │   │  RBAC        │   ║
║  └─────────────┘   └──────────────┘   └──────────────┘   ║
╚═════════════════════════════╦════════════════════════════╝
                              ║ BullMQ jobs
              ╔═══════════════▼═════════════════╗
              ║       Execution Worker           ║
              ║  tinyfish-execution-runner.ts     ║
              ║  ┌─────────────────────────────┐ ║
              ║  │   TinyFish Web Agent API    │ ║
              ║  │   89.9% Mind2Web Accuracy   │ ║
              ║  │   SSE streaming · 1000 agt  │ ║
              ║  └─────────────────────────────┘ ║
              ║  Shield · DNA · FinOps · Alerts  ║
              ╚═══════════════╦═════════════════╝
                              ║
              ╔═══════════════▼═════════════════╗
              ║     PostgreSQL via Prisma        ║
              ║     50+ models · migrations      ║
              ╚═════════════════════════════════╝
```

**Patterns:**
- Server Components for all data fetching — zero client-side API overhead
- BullMQ Worker as separate process (`npm run worker:dev`)
- SSE at `/api/internal/executions/[id]/sse` — no WebSocket server
- Repository pattern: services → repositories → Prisma

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker
- TinyFish API key — [tinyfish.ai](https://tinyfish.ai)
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
# Required: DATABASE_URL, REDIS_URL, TINYFISH_API_KEY, NEXTAUTH_SECRET
```

### 3. Start infrastructure
```bash
docker-compose up -d   # PostgreSQL :5433, Redis :6379
```

### 4. Set up database
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 5. Run
```bash
npm run dev          # Terminal 1 — Next.js on :3000
npm run worker:dev   # Terminal 2 — BullMQ worker (required for agent execution)
```

---

## Deploy to Vercel

### 1. Push to GitHub (already done)
```bash
git push origin main
```

### 2. Create Vercel project
```bash
npm i -g vercel
vercel --prod
# Or: go to vercel.com → New Project → Import from GitHub
```

### 3. Set environment variables in Vercel dashboard
```
TINYFISH_API_KEY=...
DATABASE_URL=postgresql://...         # Use Neon, Supabase, or Railway
REDIS_URL=redis://...                 # Use Upstash Redis
NEXTAUTH_SECRET=...                   # openssl rand -base64 32
NEXTAUTH_URL=https://your-app.vercel.app
ANTHROPIC_API_KEY=...                 # optional
```

### 4. Deploy worker separately
The BullMQ worker cannot run on Vercel (serverless). Deploy it to:
- **Railway**: `railway up` — runs the worker process persistently
- **Render**: create a Background Worker service pointing to `worker/index.ts`
- **Fly.io**: `fly deploy` — Dockerfile included

### 5. Database options (managed PostgreSQL)
| Provider | Free tier | Notes |
|----------|-----------|-------|
| [Neon](https://neon.tech) | ✅ 3GB | Serverless, best for Vercel |
| [Supabase](https://supabase.com) | ✅ 500MB | Includes auth + storage |
| [Railway](https://railway.app) | ✅ 1GB | Also hosts the worker |

### 6. Redis options
| Provider | Free tier | Notes |
|----------|-----------|-------|
| [Upstash](https://upstash.com) | ✅ 10K req/day | Serverless Redis, perfect for Vercel |
| [Railway Redis](https://railway.app) | ✅ 1GB | Co-locate with worker |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TINYFISH_API_KEY` | ✅ | TinyFish Web Agent API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection (port 5433 locally) |
| `REDIS_URL` | ✅ | Redis connection string |
| `NEXTAUTH_SECRET` | ✅ | 32-byte random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ prod | Full URL of your deployment |
| `ANTHROPIC_API_KEY` | optional | NL workflow builder + sentinel briefings |
| `SMTP_HOST` + `ALERT_EMAIL_TO` | optional | Email alerts |
| `SLACK_WEBHOOK_URL` | optional | Slack notifications |
| `DATAMESH_API_KEY` | optional | Public DataMesh API key validation |

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
| LLM | Anthropic Claude Haiku 4.5 |
| Billing | Stripe |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel + Railway/Render (worker) |

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── snapbuy/        # Autonomous deal sniper
│   │   ├── heartbeat/      # Synthetic user monitoring
│   │   ├── pricewatch/     # Price drop alerts
│   │   ├── ethicswatch/    # ESG & ethics intelligence
│   │   ├── recon/          # Security surface scanner
│   │   ├── pulse/          # Competitive intelligence
│   │   ├── datamesh/       # Web-to-JSON API playground
│   │   ├── results/        # Unified results hub
│   │   ├── swarm/          # Swarm orchestrator
│   │   ├── sentinels/      # Sentinel watchlist
│   │   ├── agents/         # Agent registry + leaderboard
│   │   ├── activity/       # Execution timeline + detail
│   │   ├── workflows/      # Workflow builder
│   │   └── ...             # 15+ more pages
│   ├── api/
│   │   ├── internal/       # 90+ authenticated routes
│   │   └── v1/             # Public API (DataMesh)
│   └── page.tsx            # Landing page
├── components/dashboard/
│   ├── snapbuy/            # SnapbuyDashboard
│   ├── heartbeat/          # HeartbeatDashboard
│   ├── pricewatch/         # PricewatchDashboard
│   ├── ethicswatch/        # EthicswatchDashboard
│   ├── recon/              # ReconLauncher
│   ├── pulse/              # PulseDashboard
│   ├── datamesh/           # DataMeshPlayground
│   └── ...
├── server/
│   ├── services/executions/  # tinyfish-execution-runner.ts
│   ├── services/sentinels/
│   ├── services/notifications/
│   └── integrations/tinyfish/
└── config/

prisma/schema.prisma          # 50+ models
worker/                       # BullMQ worker (separate process)
```

---

## 6-Minute Demo Script

| Time | Scene |
|------|-------|
| 0:00–0:25 | Landing page — animated agent network, benchmark chart |
| 0:25–1:45 | **SnapBuy** — RTX 5090 TRIGGERED card, price progress bars, create a snipe |
| 1:45–3:00 | **Heartbeat** — DEGRADED checkout flow, EKG chart, failure screenshot |
| 3:00–3:45 | **PriceWatch** — sparkline charts, ALERT_SENT amber card, price history |
| 3:45–4:30 | **EthicsWatch** — SEC CRITICAL alert, Apple CSR change, battle card |
| 4:30–4:50 | **Swarm** — launch 4 agents simultaneously, status grid |
| 4:50–5:10 | **DataMesh** — schema builder, extract JSON, copy curl |
| 5:10–5:30 | **Results Hub** + Agent Leaderboard |
| 5:30–6:00 | Landing page close — *"The web is now programmable."* |

---

<div align="center">

Built on **[TinyFish AI](https://tinyfish.ai)** · Powered by **Anthropic Claude** · **TinyFish Hackathon 2026**

*"The web moves faster than you do. Now you don't have to."*

</div>
