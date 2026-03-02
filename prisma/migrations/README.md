# Prisma Migrations

This directory contains explicit SQL migration artifacts for production deployment pipelines.

## Phase 3

- `20260302180000_phase3_core_models`
  - Adds `Agent`, `Workflow`, `Execution`, and `ExecutionLog`
  - Adds execution lifecycle and logging enums
  - Applies foreign keys and indexes for org-scoped access patterns

Run with:

```bash
npm run prisma:migrate:dev -- --name phase3-core-models
```
