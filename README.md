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

## Advanced Runtime Capabilities

Deterministic Replay captures execution steps and DOM state for time-travel debugging.

Self-Healing Execution resolves selector drift through semantic fallback strategies and scored recovery paths.

Agent Memory persists run metadata and failure resolution patterns so future runs adapt with context.

Operational Guardrails enforce organization policy for domains, actions, and execution windows before dispatch.

Workflow Simulation predicts path quality and selector risk before any live action is taken.

Agent Reliability Scoring computes trust from success rate, retries, failure frequency, and runtime duration.

Failure Root Cause Analysis classifies execution failures into structured categories with evidence from logs, steps, and DOM context.

Cross-Agent Knowledge Graph shares domain intelligence and recurring signals across all agents in an organization.

Web Change Radar computes DOM hashes, detects structural drift, and raises actionable change alerts in the dashboard.

Autonomy Mode learns recurring selector failures and proposes safe adaptive workflow definitions for operator review.

Real-Time Agent Control Plane enables live session streaming, approval gates, runtime controls, emergency shutdown, and debug attach workflows.

Dynamic Tool Generation Engine allows agents to generate, validate, version, install, and continuously optimize reusable automation tools from failed runs.

Operon Mission Control provides a real-time control plane for fleet status, incident detection, operational metrics, automated recovery runbooks, and controlled agent deployment.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run dev
npm run worker:dev
npm run db:seed
```

Control plane websocket gateway:

```bash
npm run control-plane:dev
```

## Production Guide Notice

Production rollout guidance is documented in:

- `docs/DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`
