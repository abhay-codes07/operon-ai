# WebOps AI

WebOps AI is a multi-tenant SaaS platform where businesses deploy AI web agents that execute real workflows on live websites using TinyFish.

This product is built as a production-oriented foundation for a venture-scale company, not a hackathon demo.

## Investor Positioning

- Category: AI-native web operations automation
- Buyer: Growth, RevOps, QA, and internal automation teams
- Core wedge: repeatable web workflows with execution traceability and org-level governance
- Product moat: workflow + execution telemetry + billing + background orchestration in one control plane

## Product Capabilities

- User signup and secure workspace access
- Multi-tenant organizations with role-based permissions
- Agent creation and workflow configuration (including schedule metadata)
- Async workflow execution via queue workers
- Execution timeline, logs, and retry actions
- Billing scaffold with Stripe checkout + webhook reconciliation
- Usage metering and quota enforcement

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- TailwindCSS
- PostgreSQL + Prisma ORM
- NextAuth (credentials sessions)
- Redis + BullMQ
- Stripe (billing scaffold)
- TinyFish Web Agent API integration
- Docker and Docker Compose

## Phase Delivery Snapshot

### Phase 1-3

- Project foundation, auth, org tenancy, and core data models

### Phase 4-6

- Dashboard UX, workflow builder, and TinyFish execution integration

### Phase 7-9

- Background jobs, observability timeline, and billing/usage controls

### Phase 10

- Multi-stage Docker build and compose runtime
- Production deployment runbook
- Shared API validation hardening
- Targeted rate limits for auth/billing/execution actions
- Stripe webhook hardening with strict metadata checks
- Security review document and architecture specification
- Demo seed data for agents/workflows/executions/logs/billing

## Demo Flow (End of Phase 10)

1. Sign up a user and bootstrap an organization.
2. Create an agent from dashboard.
3. Create a workflow and configure schedule/constraints.
4. Trigger workflow execution.
5. Inspect execution timeline and logs.
6. Observe success/failure states and retry failures.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill required values in `.env.local`.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Start app and worker

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

## Documentation

- Deployment guide: `docs/DEPLOYMENT.md`
- Security review: `docs/SECURITY_REVIEW.md`
- Architecture diagram and runtime model: `docs/ARCHITECTURE.md`

## Folder Structure

```text
src/
  app/                # Next.js routes and UI surfaces
  components/         # Shared UI components
  config/             # Environment and app configuration
  lib/                # Shared utilities
  modules/            # Domain-level types and schema contracts
  server/             # Services, repositories, queue, integrations, security
  worker/             # Queue worker runtime
prisma/               # Schema, migrations, seed data
docs/                 # Deployment, security, architecture
```

## Engineering Principles

- Strong type safety and explicit contracts
- No placeholder architecture
- Tenant isolation as a hard requirement
- Incremental, reviewable commits suitable for startup velocity

## License

Private repository. All rights reserved.
