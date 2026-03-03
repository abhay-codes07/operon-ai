# Operon AI

## Category Thesis

Operon AI defines the category of Autonomous Web Operations Infrastructure.

It is the control layer for organizations that run revenue, product, and operational workflows across live websites, where execution reliability matters as much as intelligence.

## The New Operational Frontier

The browser has become a production surface, not just a user interface.

Critical business work now depends on repeated web interactions across fragmented systems. The bottleneck is no longer access to AI. The bottleneck is operating AI workflows with consistency, accountability, and control.

Autonomous web workflows are becoming a core operating primitive. Operon turns that primitive into a system of record.

## What Operon Enables

Operon converts fragile, manual browser work into governed operational throughput.

Teams ship faster without sacrificing oversight. Workflows execute with clear ownership, predictable recovery, and traceable outcomes. Operational decisions move from guesswork to evidence.

The result is durable leverage: more work completed, fewer operational breaks, and a tighter path from intent to execution.

## Who This Is For

Operon serves product, growth, RevOps, QA, and operations teams that depend on recurring browser-based processes to run the business.

It fits organizations where workflow reliability directly influences revenue, customer experience, and delivery velocity.

## Core Product Tenets

Operon is workflow-first. Agent behavior is defined, reviewable, and repeatable.

Operon is reliability-first. Execution is orchestrated for continuity under real operational conditions.

Operon is accountability-first. Every run produces a clear operational trail.

Operon is governance-first. Access, tenancy boundaries, and usage controls are non-negotiable system behavior.

Operon is commercially aligned. Product usage and business model constraints remain in sync.

## Demo Scenario

A growth operations lead creates a workflow to monitor competitor pricing changes and trigger internal follow-up.

An agent executes the workflow on schedule, handles multi-step navigation, and records the full run context. The team reviews timeline events, validates outcomes, and retries failed runs with full traceability.

What was previously manual and intermittent becomes dependable and continuous.

## Engineering Posture

Operon is engineered as operating infrastructure, not task automation.

System boundaries are explicit. Execution state is durable. Operational behavior is observable. Governance is enforced at the platform level.

The architecture is designed to preserve product velocity without compromising control.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run dev
npm run worker:dev
npm run db:seed
```

## Production Guide Notice

Production rollout guidance is documented in:

- `docs/DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`
