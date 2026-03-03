# Deployment Guide

This guide covers production deployment for WebOps AI.

## Prerequisites

- Docker 24+
- Docker Compose v2+
- PostgreSQL and Redis (managed or self-hosted)
- Stripe account (checkout + webhook)
- TinyFish API credentials

## 1. Environment Setup

Create `.env` from `.env.example` and set production values:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_GROWTH`
- `TINYFISH_API_KEY`
- `TINYFISH_BASE_URL`
- `TINYFISH_EXECUTE_PATH`

## 2. Build and Start Services

```bash
docker compose build
docker compose up -d
```

## 3. Run Prisma Migrations

```bash
docker compose exec app npm run prisma:migrate:dev -- --name production-bootstrap
```

For stricter production workflows, generate and run migrations in CI before deployment.

## 4. Seed Demo Data (Optional)

```bash
docker compose exec app npm run db:seed
```

## 5. Stripe Webhook Routing

Use Stripe CLI in staging:

```bash
npm run stripe:listen
```

Configure webhook endpoint in production:

- `POST /api/stripe/webhook`

## 6. Verify Runtime

- App responds on `/dashboard`
- Worker process is running (`docker compose logs worker`)
- Queue health endpoint returns counters: `GET /api/internal/queue/health`
- Trigger workflow and verify status transitions + logs

## 7. Scaling Notes

- Scale workers independently from app web pods
- Keep queue and database in same region to reduce latency
- Use object storage provider in future for screenshot artifacts

## 8. Rollback Strategy

- Keep previous image tags available
- Roll back app and worker together
- Preserve database backward-compatible migrations when possible
