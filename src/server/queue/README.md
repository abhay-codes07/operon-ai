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
