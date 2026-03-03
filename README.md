# Operon AI

## Category-Defining Statement

Operon AI is infrastructure for autonomous web operations.
Teams run critical browser workflows through AI agents with control, reliability, and auditability.

## The Shift: Autonomous Web Operations

Revenue, support, compliance, and QA still run in the browser.
The constraint is no longer model capability. The constraint is production reliability.

Autonomous operations become standard when execution is repeatable, governed, and observable.
Operon is built for that standard.

## What Operon Enables

Operon converts manual browser work into managed systems.
Workflows run consistently, failures recover predictably, and outcomes remain traceable.

Teams gain throughput without losing control.

## Designed for Teams Running Real Work

Operon serves product, operations, and revenue teams with recurring browser-heavy workflows.
It fits organizations where execution quality directly affects growth and reliability.

## Core System Pillars

**Workflow System**
Agents execute explicit multi-step workflows, not ad hoc prompts.

**Execution Reliability**
Queue-backed orchestration and retry controls keep runs stable under load.

**Operational Visibility**
Structured logs and timeline traces make every run inspectable.

**Tenant Governance**
Multi-tenant boundaries and RBAC enforce access, ownership, and accountability.

**Commercial Control**
Usage enforcement and billing integration align product behavior with account policy.

## Architecture Philosophy

Operon treats automation as systems infrastructure.
Execution state is durable, access is policy-driven, and runtime behavior is explicit.

The platform combines a typed application layer, durable data model, asynchronous execution fabric, and external web agent runtime.
The result is predictable operations across app, worker, and tenant boundaries.

## Why Operon Exists

Teams need automation they can trust in production.
Operon exists to make autonomous browser execution dependable, governable, and measurable.

## Production Deployment

Operon ships as containerized web and worker services with isolated state backends.
Environment-based configuration, queue isolation, and usage guardrails are part of the default operating model.

## Demo Walkthrough

1. Create an account and workspace.
2. Define an agent and workflow.
3. Trigger execution on a live target.
4. Review status, timeline, and logs.
5. Retry failures and verify recovery.
6. Inspect account usage controls.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run dev
npm run worker:dev
npm run db:seed
```

### Docker

```bash
docker compose up --build
```

## Repository Structure

```text
src/
  app/
  components/
  config/
  modules/
  server/
  worker/
prisma/
```
