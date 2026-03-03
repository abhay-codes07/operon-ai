# Operon AI

Operon AI is an AI-native SaaS platform for autonomous web operations.

Teams use Operon AI to deploy agents that execute real workflows on live websites: navigation, session handling, multi-step actions, retries, and full audit history.

Built for venture-scale growth from day one.

## One-Line Pitch

Operon AI is the control plane for reliable AI web agents in production.

## Why This Matters

Browser work still powers critical operations across growth, RevOps, QA, and back-office teams. Most automation products break on real-world websites, lack observability, or cannot be governed safely in multi-tenant environments.

Operon AI solves this with:

- Workflow-driven execution, not prompt-only automation
- Queue-backed reliability with retries and failure recovery
- Tenant isolation and role-based access controls
- Timeline-first execution observability
- SaaS billing and usage controls out of the box

## Product Overview

Core product capabilities available now:

- User signup and organization provisioning
- Multi-tenant RBAC (owner/admin/member)
- Agent and workflow creation
- Manual and async workflow execution
- Execution lifecycle tracking and structured logs
- Retry operations for failed runs
- Billing scaffold with Stripe checkout + webhook reconciliation
- Usage metering and quota enforcement

## ICP and Wedge

- Initial ICP: startup and mid-market product teams with recurring browser workflows
- Primary use cases: competitive monitoring, website QA, regression sweeps, operational back-office flows
- Wedge: replace brittle scripts/manual browser labor with observable autonomous workflows

## Architecture Summary

- Web app: Next.js 14 + TypeScript
- Data layer: PostgreSQL + Prisma
- Auth: NextAuth
- Queueing: Redis + BullMQ
- Billing: Stripe scaffold
- Agent runtime integration: TinyFish Web Agent API
- Deployment: Docker + Docker Compose

See full architecture: `docs/ARCHITECTURE.md`

## Production Readiness

Phase 10 completion includes:

- Multi-stage Docker build and compose runtime
- Deployment runbook
- Strict request validation across internal APIs
- Route-level rate limiting for sensitive actions
- Hardened Stripe webhook handling
- Security review with residual risk register
- Demo seed dataset for investor demos

Security review: `docs/SECURITY_REVIEW.md`
Deployment guide: `docs/DEPLOYMENT.md`

## Demo Flow

1. Sign up and create organization.
2. Create an agent.
3. Define workflow and schedule metadata.
4. Trigger execution.
5. Inspect timeline and logs.
6. Observe success/failure and retry.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run app and worker

```bash
npm run dev
npm run worker:dev
```

### 5. Seed demo data

```bash
npm run db:seed
```

## Docker Quick Start

```bash
docker compose up --build
```

Services:

- App: `http://localhost:3000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Key Scripts

- `npm run dev` - Next.js dev server
- `npm run worker:dev` - BullMQ worker in watch mode
- `npm run build` - Production app build
- `npm run lint` - ESLint checks
- `npm run prisma:migrate:dev` - Local migrations
- `npm run db:seed` - Demo tenant and activity data

## Repository Structure

```text
src/
  app/                # Next.js routes and product UI
  components/         # Shared UI components
  config/             # Environment and app configuration
  lib/                # Shared utilities
  modules/            # Domain schemas and contracts
  server/             # Services, repositories, queue, integrations, security
  worker/             # Queue worker runtime
prisma/               # Schema, migrations, seed data
docs/                 # Deployment, architecture, security
```

## License

Private repository. All rights reserved.
