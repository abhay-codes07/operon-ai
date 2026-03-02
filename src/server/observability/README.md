# Observability

Phase 8 observability components provide structured diagnostics for execution flows.

## Capabilities

- Structured application logger with normalized JSON payloads
- Trace ID generation and correlation across API -> queue -> worker -> TinyFish
- Execution detail API surfaces for diagnostics and timeline reconstruction
- Polling-based near-real-time timeline updates in dashboard views

## Key Files

- `logger.ts` - structured server logging primitives
- `tracing.ts` - trace-id generation helpers
- `../queue/monitoring/health.ts` - queue health snapshots

## Operator Surfaces

- Activity timeline dashboard with auto-refresh
- Execution detail page with output payload and metadata-rich logs
- Retry controls from timeline and detail views
