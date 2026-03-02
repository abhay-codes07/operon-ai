# TinyFish Integration

This module contains the Phase 6 TinyFish Web Agent integration scaffold.

## Components

- `client.ts`
  - Authenticated HTTP client (`Bearer` API key)
  - Timeout handling via `AbortController`
  - Structured API error (`TinyFishApiError`)
- `request-builder.ts`
  - Transforms internal workflow definition into provider payload
- `response-parser.ts`
  - Normalizes provider statuses/events into internal execution lifecycle artifacts
- `types.ts`
  - Provider request/response contracts

## Execution Flow

1. `POST /api/internal/workflows/[workflowId]/execute`
2. Queue execution record
3. Run TinyFish orchestration (`tinyfish-execution-runner.ts`)
4. Persist logs, status transitions, output payload, and screenshots

## Environment Variables

- `TINYFISH_API_KEY`
- `TINYFISH_BASE_URL`
- `TINYFISH_EXECUTE_PATH`
- `TINYFISH_TIMEOUT_MS`
- `SCREENSHOT_STORAGE_BASE_PATH`
