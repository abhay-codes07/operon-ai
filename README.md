# Operon AI

## Category-Defining Statement

Operon AI is the operating layer for autonomous web operations.
It gives modern teams a reliable way to run critical browser workflows through AI agents, with the control, traceability, and uptime expectations of enterprise software.

## The Shift: Autonomous Web Operations

Software teams already run revenue, support, compliance, and growth through browser-based systems. The interface to the internet is still the browser, and the browser is still full of repetitive operational work.

The shift is no longer whether AI can perform these actions. The shift is whether those actions can be run as dependable production infrastructure.

Autonomous web operations becomes inevitable when three conditions are met: agents can execute multi-step tasks, organizations can govern access and risk, and teams can trust outcomes with full execution visibility. Operon is built around that convergence.

## What Operon Enables

Operon turns web work from manual effort into managed systems.

Teams move from one-off tasks to repeatable operations, from fragile scripts to auditable workflows, and from reactive firefighting to measurable execution quality.

The result is simple: faster throughput, lower operational drag, and a durable automation layer that scales with the business.

## Designed for Teams Running Real Work

Operon is designed for high-velocity product and operations organizations where browser workflows directly impact growth and reliability.

Primary teams include:

- Growth and RevOps teams operating lead capture, enrichment, and market monitoring loops
- Product and QA teams running recurring validation across live product surfaces
- Operations teams managing repetitive, high-volume workflows across third-party web tools

## Core System Pillars

**Workflow Intelligence**
Operon models agent behavior as explicit, multi-step workflows so execution is structured, reviewable, and repeatable.

**Reliable Execution Fabric**
Queue-backed orchestration with retry controls ensures web tasks run predictably under real production conditions.

**Operational Visibility**
Structured logs and timeline-based observability provide a clear narrative for every run, including failures and recovery paths.

**Tenant-Grade Governance**
Multi-tenant architecture with role-based access control enforces clear boundaries for teams, permissions, and data ownership.

**Commercial Readiness**
Billing and usage enforcement are integrated into the platform model so deployment and monetization can scale together.

## Architecture Philosophy

Operon is intentionally designed as software infrastructure, not an automation toy.

The application layer, execution layer, and data layer are separated with explicit contracts. Agent workflows are persisted and versionable. Execution state is durable. Access is policy-driven. Runtime concerns like retries, logging, and quota enforcement are treated as first-class system behavior.

Stack decisions reflect this posture:

- Next.js + TypeScript for product velocity with strict interfaces
- PostgreSQL + Prisma for durable, relational execution history
- Redis + BullMQ for controlled asynchronous job orchestration
- NextAuth-based identity with organization-aware authorization
- TinyFish Web Agent API for live web execution

## Why Operon Exists

Teams should not have to choose between speed and control when automating web operations.

Operon exists to make autonomous browser work dependable enough for mission-critical workflows and clear enough for teams to trust at executive and operator levels alike.

## Production Deployment

Operon ships with a production-oriented deployment baseline:

- Dockerized application and worker services
- Redis and PostgreSQL service composition
- Environment-driven configuration and secret boundaries
- Deployment and security documentation for operational rollout

For implementation details, see:

- `docs/DEPLOYMENT.md`
- `docs/SECURITY_REVIEW.md`
- `docs/ARCHITECTURE.md`

## Demo Walkthrough

1. Create an account and provision an organization workspace.
2. Define an agent aligned to a real operational objective.
3. Configure a workflow with clear execution intent.
4. Trigger a run against a live web target.
5. Review timeline events, logs, and execution status.
6. Retry failed runs and validate recovery behavior.
7. Inspect usage and billing state in the account context.

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

### 4. Start the app and worker

```bash
npm run dev
npm run worker:dev
```

### 5. Seed local data

```bash
npm run db:seed
```

### Docker quick start

```bash
docker compose up --build
```

## Repository Structure

```text
src/
  app/                # Routes and product surfaces
  components/         # Shared UI
  config/             # Runtime and environment configuration
  lib/                # Utilities
  modules/            # Domain contracts and schemas
  server/             # Services, repositories, queue, integrations, security
  worker/             # Background execution runtime
prisma/               # Schema, migrations, seed data
docs/                 # Deployment, architecture, security
```
