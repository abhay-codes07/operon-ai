/**
 * Server-side worker trigger.
 *
 * Fires an independent HTTP request to /api/worker/run which creates a NEW
 * Vercel serverless function invocation — independent of the caller.
 * This is far more reliable than browser-side fetch() because it doesn't get
 * cancelled when the user navigates away.
 *
 * Usage: call triggerWorker(executionId) from any server-side route handler.
 * Do NOT await it — fire and forget.
 */

function getWorkerBaseUrl(): string {
  // Prefer explicit NEXTAUTH_URL (works for both local and Vercel)
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  // Fallback: Vercel automatically sets VERCEL_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function triggerWorker(executionId?: string): void {
  const base = getWorkerBaseUrl();
  const url = executionId
    ? `${base}/api/worker/run?executionId=${executionId}`
    : `${base}/api/worker/run`;

  const secret = process.env.CRON_SECRET;

  fetch(url, {
    method: "GET",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    // keepalive: true not needed — this creates an independent invocation
  }).catch(() => null); // fire-and-forget; errors are silently ignored
}

export function triggerWorkers(executionIds: string[]): void {
  for (const id of executionIds) {
    triggerWorker(id);
  }
}
