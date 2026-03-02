# WebOps AI

WebOps AI is a SaaS platform for deploying AI web agents that execute real multi-step workflows on live websites.

This repository contains the product foundation for a venture-backable, multi-tenant operations platform built with Next.js 14 and TypeScript.

## Product Direction

WebOps AI is not a chatbot and not a retrieval wrapper. The platform is designed to:

- Navigate websites through autonomous agents
- Execute repeatable workflows with stateful sessions
- Track execution lifecycle and structured logs
- Store traceable run history for auditability
- Surface operational visibility in a timeline-first dashboard

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- TailwindCSS
- PostgreSQL + Prisma
- NextAuth (Credentials provider with secure JWT sessions)
- Redis + BullMQ (upcoming phases)
- Stripe billing scaffold (upcoming phases)
- TinyFish Web Agent API integration (upcoming phases)

## Phase 1 Scope (Completed)

- Next.js project initialization
- Strict TypeScript compiler settings
- Tailwind baseline and global design tokens
- ESLint + Prettier integration
- Environment variable contract + runtime validation utility
- Modular codebase architecture foundations
- Root layout shell and product metadata
- Dashboard foundation UI for agent and execution overview

## Phase 2 Scope (Completed)

- NextAuth credentials authentication
- User sign-up and sign-in flows
- Multi-tenant organization model and membership roles
- Middleware-based protected route handling
- Tenant-aware server-side session and authorization guards
- Seed script for owner workspace bootstrap

## Phase 3 Scope (Completed)

- Prisma core models for `Agent`, `Workflow`, `Execution`, and `ExecutionLog`
- Execution lifecycle enums and organization-scoped indexes
- SQL migration artifact for production rollout
- Type-safe domain contracts and validation schemas
- Organization-scoped repositories with paginated queries
- Service-layer orchestration for model lifecycle operations
- Protected internal APIs for agent/workflow/execution persistence

## Phase 4 Scope (Completed)

- Enterprise dashboard shell with responsive sidebar navigation
- Dedicated `Agents` management page and status-aware listing table
- In-dashboard agent creation modal connected to protected APIs
- Dedicated `Activity` page with execution and log timeline panels
- Unified status badge system for agent/execution states
- Route-level loading skeletons and error boundaries for dashboard views
- Interactive status filtering for operational list views

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill the required values in `.env.local`.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Start the app

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Auto-format repository files
- `npm run format:check` - Verify formatting
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run local development migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed owner user + demo organization

## Folder Structure

```text
src/
  app/                # Next.js App Router entrypoints
  components/         # Shared UI and layout components
  config/             # App/site/environment configuration
  lib/                # Utility helpers
  modules/            # Domain-level feature types and contracts
  server/             # Server-side repositories and services (phase-based expansion)
  types/              # Shared TypeScript types
```

## Internal API Surface (Phase 3)

- `GET/POST /api/internal/agents`
- `GET/POST /api/internal/workflows`
- `GET/POST /api/internal/executions`

## Engineering Principles

- Strong typing and explicit boundaries by default
- No placeholder architecture that cannot scale
- Incremental delivery with production-oriented commit hygiene
- Clear separation between UI, domain modules, and server orchestration layers

## License

Private repository. All rights reserved.
