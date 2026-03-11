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

Secure Agent Gateway intercepts every agent action with policy-as-code enforcement, sandboxed execution, risk scoring, and immutable execution audit trails.

Progressive Workflow Delivery adds canary traffic routing, release health snapshots, and automatic rollback when live failure thresholds are breached.

Operon Shield adds a dedicated prompt-injection defense layer that separates trusted workflow intent from untrusted web content at runtime, sanitizes context windows, and blocks unsafe execution paths before action dispatch.

Operon Autopilot introduces learn-mode recording, workflow compilation, domain memory, and self-repair so operators can teach a flow once and keep it running as websites change.

## Operon Autopilot

Operon Autopilot converts live operator behavior into reusable workflow infrastructure.

Operators record actions in Learn Mode, review the generated workflow, parameterize dynamic inputs, and approve it into the standard workflow runtime.

Domain Memory stores working selectors and navigation patterns per domain. Self-repair logic uses that memory to recover from selector drift and logs repair events for review in the Autopilot dashboard.

Autopilot API surface:

- `POST /api/autopilot/start`
- `POST /api/autopilot/action`
- `POST /api/autopilot/finish`
- `GET /api/autopilot/session/[id]`

Autopilot UI surface:

- `/autopilot/learn` for recording, compiling, reviewing, and approving workflows.
- `/dashboard/autopilot` for learned session history, domain memory quality, and repair telemetry.

## Operon Shield

Operon Shield is the runtime security layer for autonomous browser agents.

It enforces three guarantees:

- Instruction integrity: trusted workflow instructions remain isolated from untrusted page content.
- Runtime containment: suspicious actions are blocked or paused through policy checks and behavior baselines.
- Security observability: prompt injection attempts are logged, scored, alerted, and surfaced in a live threat timeline.

Core Shield surfaces:

- `GET /api/shield/events`
- `POST /api/shield/policies`
- `GET /api/shield/policies`
- `GET /api/shield/summary`
- `GET /api/shield/timeline`
- `POST /api/shield/test-injection`
- `GET /api/shield/workflows/[id]/status`
- `GET|POST /api/shield/workflows/[id]/baseline`
- `POST /api/shield/workflows/[id]/baseline/infer`

UI surfaces:

- `/dashboard/shield` for threat posture, policy controls, timeline, and demo-attack simulation.
- `/workflows/[id]/shield` for workflow-level trusted/untrusted context review and baseline enforcement.

## OperonHub Marketplace

OperonHub is the workflow marketplace for real-world TinyFish web agent automations.

Organizations can publish reusable templates, install them instantly, and run live demos against production websites.

Template reliability is continuously scored from execution outcomes, ratings, and recency. A background worker recomputes scores every 6 hours.

### Publish

Teams publish versioned templates with workflow definitions, changelogs, pricing metadata, and category tags.

### Install

Organizations install templates into their workspace with tracked version state and lifecycle status.

### Reliability Scoring

OperonHub computes reliability from execution outcomes, marketplace ratings, and release freshness, then updates leaderboard ranking.

### Live Agents

Template detail pages can trigger live demo runs through TinyFish, returning structured event traces and run output.

## Workflow SLA Contracts

Workflow SLA Contracts let each workflow define schedule expectations, maximum failure rate, runtime timeout, rolling windows, and escalation channels.

SLA monitor workers evaluate execution timeout, missed schedules, and failure-rate thresholds every 5 minutes and create structured breach incidents automatically.

Incidents can be reviewed and resolved from the Incident Center, with attached run-log context and operator retry actions.

## Business Impact Dashboard

Business Impact profiles map workflows to value categories and estimated dollar value per successful run.

The Impact Dashboard aggregates monthly ROI, savings, and revenue-protection totals while ranking top-value workflows.

## Operon Pipelines

Operon Pipelines orchestrate multiple agents as a single durable run.  
Each step executes in sequence, passes structured output forward, and records full run state for recovery and audit.

Execution model:

- `Pipeline` defines ordered agent steps with input/output mappings.
- `PipelineRun` tracks lifecycle (`RUNNING`, `PAUSED`, `FAILED`, `COMPLETED`).
- `PipelineStepRun` binds each step to an underlying agent execution and captures payload handoff.

Operational controls:

- Start, pause, and resume pipeline runs through API and UI controls.
- On step failure, the pipeline pauses and exposes manual retry/skip controls.
- Background pipeline runner worker advances eligible steps and resolves completion.

Observability and governance:

- Live run monitor shows step state, execution links, and current pipeline status.
- Audit trail events include `PIPELINE_CREATED`, `PIPELINE_STARTED`, `PIPELINE_STEP_COMPLETED`, `PIPELINE_FAILED`, and `PIPELINE_RESUMED`.
- Pipeline stats endpoint supports operational dashboards (`/api/pipelines/stats`).

## Operon FinOps

Operon FinOps provides execution-level cost intelligence across agents, workflows, and pipelines.

Core capabilities:

- Cost attribution by event type (`LLM_CALL`, `BROWSER_RUNTIME`, `RETRY`, `SELF_HEALING`)
- Workflow cost summaries (`total`, `avg per run`, `monthly spend`)
- Budget controls with threshold alerts and automatic throttling strategies
- ROI scoring using workflow business impact vs execution cost
- Cost anomaly detection for runs that exceed baseline cost by >3x
- Pipeline step-level and run-level cost breakdowns

Operational endpoints:

- `GET /api/finops/workflows/[id]`
- `GET /api/finops/anomalies`
- `POST /api/finops/budget`
- `GET /api/finops/roi`
- `GET /api/finops/summary`
- `GET /api/finops/pipelines/[id]`

## Competitive Intelligence Nerve Center

Operon runs autonomous competitor-monitoring agents in parallel and synthesizes change signals into actionable insights.

Nerve Center capabilities:

- Competitor registry with organization-scoped targets
- Multi-signal monitoring (`PRICING_CHANGE`, `FEATURE_CHANGE`, `REVIEW_SENTIMENT`, `JOB_POSTING`, `HEADCOUNT_CHANGE`)
- Parallel agent execution across pricing, feature, review, jobs, and headcount monitors
- Signal aggregation and insight synthesis for high-impact competitor changes
- Daily morning briefing generation and Slack alert delivery
- Intelligence dashboard for signals, trend visualization, alerts, and competitor operations

Primary intelligence endpoints:

- `GET /api/intelligence/competitors`
- `POST /api/intelligence/competitors`
- `DELETE /api/intelligence/competitors/[id]`
- `GET /api/intelligence/signals`
- `GET /api/intelligence/insights`
- `POST /api/intelligence/run`
- `GET /api/intelligence/report`

## AI Agent Compliance Passport

Every workflow carries a Compliance Passport that records approvals, execution actions, visited domains, extracted data categories, and policy violations.

Production execution is blocked until the current workflow version has an active compliance approval. When a workflow definition changes, prior approval is no longer valid.

Passports generate plain-English summaries for non-engineering stakeholders, assign risk levels (`LOW`, `MEDIUM`, `HIGH`), and expose downloadable PDF reports.

Compliance monitoring runs continuously:

- Runtime event capture logs `READ`, `WRITE`, `SUBMIT`, and `EXTRACT` actions per run.
- Violation detection flags out-of-allowlist domains, excessive extraction, and policy breaches.
- Daily compliance worker refreshes workflow passport summaries automatically.
- Audit trail entries are written for `WORKFLOW_APPROVED`, `WORKFLOW_REVOKED`, and `COMPLIANCE_VIOLATION`.

Compliance API surface:

- `GET /api/compliance/workflows/[id]`
- `POST /api/compliance/workflows/[id]/request`
- `POST /api/compliance/workflows/[id]/approve`
- `POST /api/compliance/workflows/[id]/revoke`
- `GET /api/compliance/workflows/[id]/events`
- `GET /api/compliance/passport/[workflowId]`
- `GET /api/compliance/passport/[workflowId]/pdf`
- `GET /api/compliance/violations`
- `GET /api/compliance/dashboard`

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
