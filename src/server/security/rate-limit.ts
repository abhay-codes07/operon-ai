import { NextResponse } from "next/server";

type RateLimitPolicy = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function buildRateLimitKey(scope: string, request: Request, actorId?: string) {
  const identity = actorId?.trim() ? actorId : getClientIp(request);
  return `${scope}:${identity}`;
}

function getBucket(key: string, now: number, policy: RateLimitPolicy) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const created: RateLimitState = { count: 0, resetAt: now + policy.windowMs };
    buckets.set(key, created);
    return created;
  }

  return existing;
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  policy: RateLimitPolicy,
  actorId?: string,
) {
  const now = Date.now();
  const key = buildRateLimitKey(scope, request, actorId);
  const bucket = getBucket(key, now, policy);

  if (bucket.count >= policy.maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfterSeconds: retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  bucket.count += 1;
  return null;
}
