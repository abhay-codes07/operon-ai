# Queue Processing

Phase 7 introduces background job processing with BullMQ + Redis.

## Execution Queue

- Queue name: `${BULLMQ_QUEUE_PREFIX}:execution-jobs`
- Job payload: `ExecutionJobData`
- Retries: controlled by `BULLMQ_EXECUTION_ATTEMPTS`
- Backoff: exponential with `BULLMQ_EXECUTION_BACKOFF_MS`

## Worker Runtime

Start worker process:

```bash
npm run worker
```

Development mode with file watching:

```bash
npm run worker:dev
```

## Lifecycle

1. API route enqueues execution job
2. Worker picks job and calls TinyFish runner
3. Execution status/logs/output are persisted
4. On terminal failure, worker marks execution `FAILED` and writes structured error event

## Monitoring

- Queue health endpoint: `GET /api/internal/queue/health`

## Operon Pipelines Runner

Pipelines use a dedicated interval worker (`pipeline-runner.worker.ts`) to orchestrate multi-agent step chains.

- Scans `PipelineRun` records in `RUNNING` state
- Dispatches queued `PipelineStepRun` executions in order
- Evaluates step completion and advances to next step
- Pauses pipeline on failed step and preserves error state for manual retry/skip

## FinOps Cost Monitor

FinOps uses `cost-monitor.worker.ts` to enforce cost governance every 10 minutes.

- Recomputes budget posture for workflows
- Applies throttling strategy when budgets are exceeded
- Detects recent cost anomalies against baseline run cost
- Tracks monthly spend snapshots for dashboard visibility
