<div align="center">

![TinyFish Hackathon 2026](https://img.shields.io/badge/TinyFish_Hackathon_2026-Submission-22d3ee?style=for-the-badge&labelColor=040611)
![Mind2Web Accuracy](https://img.shields.io/badge/Mind2Web_Accuracy-89.9%25-22d3ee?style=for-the-badge&labelColor=040611)
![Next.js 14](https://img.shields.io/badge/Next.js_14-App_Router-000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

# Operon AI

**The web is now programmable.**

Operon is an autonomous web agent platform powered by [TinyFish AI](https://tinyfish.ai). Deploy fleets of parallel agents that navigate, extract, and act across any website — with full observability, security, and learning built in.

</div>

---

## Why TinyFish

|  | Operon / TinyFish | OpenAI Operator | Claude Computer Use | Browser Use |
|---|---|---|---|---|
| **Mind2Web Accuracy** | **89.9%** | 61.3% | 56.3% | 30.0% |
| **Easy→Hard Degradation** | **−15.6 pts** | −39 pts | −45 pts | −58 pts |
| **Parallel Agents** | **1,000** | 1 | 1 | 1 |
| **Cost / step** | **$0.015** | ~$0.08 | ~$0.12 | varies |

---

## Features

### SnapBuy — Autonomous Deal Sniper
Set a trigger condition in plain English ("price drops below $899", "back in stock", "ticket available under $400"). A TinyFish agent watches the URL on a schedule. The instant the condition is met, it doesn't alert — it **acts**. Completes the purchase, books the slot, or reserves the item using your saved details. First tool to close the loop from monitoring → action.

### Heartbeat — Synthetic User Monitoring
Define your product's critical user journeys in plain English. TinyFish agents run them every 15 minutes against your live product. If anything breaks — wrong page, unclickable button, missing form field — you get an alert with a screenshot of exactly what failed and which step. Visual UI understanding, not just HTTP status codes.

### Swarm Orchestration
Launch fleets of parallel TinyFish agents across multiple URLs simultaneously from one command. A live grid shows every agent's real-time status. Results aggregate automatically.

```bash
POST /api/internal/swarm/launch
{ "agentId": "...", "targetUrls": ["amazon.com", "ebay.com", "walmart.com"] }
```

### Sentinel Watchlist
Deploy always-on agents that monitor specific URLs on a schedule. Claude determines if a detected change is semantically meaningful and auto-generates an intelligence briefing — not just "the DOM changed."

### Agent DNA Transfer
After each successful execution, Operon extracts a behavioral fingerprint — the exact action sequence, selector patterns, and timing that worked. Transferable to new agents for near-instant first-run success.

### Recon — Security Surface Scanner
Fan out 6 TinyFish agents across a target domain simultaneously: admin panel exposure, sensitive file disclosure, login error enumeration, directory listing, unauthenticated API endpoints, missing security headers. Full severity-rated report in minutes.

### Pulse — Competitive Intelligence Engine
Point at any competitor domain. Three parallel agents monitor pricing tiers, hiring signals (ML engineer surge = new AI feature in 90 days), and feature page changes. Claude synthesizes a battle card automatically.

### DataMesh — Web-to-JSON Extraction API
Public REST API: define a schema, get structured data from any URL.

```bash
POST /api/v1/extract
{ "url": "...", "schema": { "price": "number", "title": "string" } }
→ { "data": { "price": 979.99, "title": "..." }, "confidence": 0.96 }
```

### Results Hub
Every execution result in one place — prices, jobs, extracted data, summaries. Smart output preview auto-detects result type. Auto-refreshes every 3s while agents are active.

### Real-Time SSE Execution Stream
Live events stream from the BullMQ worker to the browser via Server-Sent Events — no WebSocket server. Auto-closes on terminal status.

### NL Workflow Builder
Describe a task in plain English → Claude decomposes it into a complete workflow definition with target URL, cron schedule, step breakdown, guardrails.

### Agent Performance Leaderboard
Side-by-side reliability ranking: composite score combining success rate, retry penalty, failure frequency, latency. Gold/silver/bronze tier badges.

### Operon Shield
Runtime prompt injection defense — every agent action scanned before execution. Injections scoring ≥70 blocked with full threat telemetry.

### Self-Healing Selectors
Semantic fallback when selectors fail. Tries `data-testid`, `aria-label`, fuzzy similarity. All resolutions logged with strategy and confidence.

### Failure Root Cause Analysis
Automated failure classification (`SELECTOR_DRIFT`, `NAVIGATION_FAILURE`, `AUTHENTICATION_ISSUE`, `PAGE_LOAD_TIMEOUT`) from logs, failed steps, DOM snapshots.

### Human-in-the-Loop Co-Pilot
When agent confidence drops below threshold, execution pauses for operator review. Ghost-cursor preview, approve or override, then resumes autonomously.

### Mission Control
Fleet-level incident detection with automated runbook execution across `SELECTOR_ERROR_LOOP`, `FAILURE_SPIKE`, `RETRY_LOOP` patterns.

### FinOps Intelligence
Per-run cost tracking (browser runtime + LLM tokens + self-healing), monthly aggregation, anomaly detection, per-workflow budget enforcement.

### Compliance Passport
Full audit trail of every agent action with plain-English compliance summary via Claude. Violation detection with configurable thresholds.

### Canary Releases
Progressive rollout for workflow changes with automatic rollback on failure threshold.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js 14 App                      │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  App Router  │  │  API Routes │  │  NextAuth   │  │
│  │  (RSC + CC)  │  │  90+ routes │  │  RBAC       │  │
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
- Server Components for data fetching — zero client-side API overhead on dashboard pages
- BullMQ Worker as a separate process (`npm run worker:dev`)
- SSE via `/api/internal/executions/[id]/sse` — no WebSocket server
- Repository pattern — services → repositories → Prisma

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
| Email | Nodemailer (SMTP) |
| Deployment | Docker + docker-compose |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)
- TinyFish API key — [tinyfish.ai](https://tinyfish.ai)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com) *(optional — powers NL builder + sentinel briefings)*

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

### 5. Run
```bash
# Terminal 1
npm run dev

# Terminal 2 — required for agents to execute
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TINYFISH_API_KEY` | ✅ | TinyFish Web Agent API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection (port 5433 in docker-compose) |
| `REDIS_URL` | ✅ | Redis connection |
| `NEXTAUTH_SECRET` | ✅ | 32-byte random secret |
| `ANTHROPIC_API_KEY` | optional | NL workflow builder + sentinel briefings |
| `SMTP_HOST` + `ALERT_EMAIL_TO` | optional | Email alerts |
| `SLACK_WEBHOOK_URL` | optional | Slack notifications |

See [`.env.example`](.env.example) for the full reference.

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── snapbuy/        # SnapBuy — autonomous deal sniper
│   │   ├── heartbeat/      # Heartbeat — synthetic user monitoring
│   │   ├── recon/          # Recon — security surface scanner
│   │   ├── pulse/          # Pulse — competitive intelligence
│   │   ├── datamesh/       # DataMesh — web-to-JSON API playground
│   │   ├── results/        # Results Hub
│   │   ├── swarm/          # Swarm orchestrator
│   │   ├── sentinels/      # Sentinel watchlist
│   │   ├── agents/         # Agent registry + leaderboard
│   │   ├── activity/       # Execution timeline + detail
│   │   ├── workflows/      # Workflow builder
│   │   └── ...             # 15+ more pages
│   ├── api/
│   │   ├── internal/       # 90+ authenticated API routes
│   │   └── v1/             # Public API (DataMesh extract)
│   └── page.tsx            # Landing page
├── components/dashboard/
│   ├── snapbuy/            # SnapbuyDashboard
│   ├── heartbeat/          # HeartbeatDashboard
│   ├── recon/              # ReconLauncher
│   ├── pulse/              # PulseDashboard
│   ├── datamesh/           # DataMeshPlayground
│   ├── swarm/              # SwarmLaunchForm, SwarmHistoryGrid
│   ├── sentinels/          # SentinelGrid, AddSentinelModal
│   └── activity/           # AgentDnaPanel, ExecutionDetailLivePanel
├── server/
│   ├── services/executions/  # tinyfish-execution-runner.ts (core)
│   ├── services/notifications/
│   ├── services/sentinels/
│   └── integrations/tinyfish/
└── config/

prisma/
├── schema.prisma           # 50+ models
└── migrations/

worker/                     # BullMQ worker (separate process)
```

---

## License

MIT

---

<div align="center">
  <p>Built on <a href="https://tinyfish.ai">TinyFish AI</a> · Powered by Anthropic Claude · TinyFish Hackathon 2026</p>
</div>
