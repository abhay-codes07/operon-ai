import { createHash, randomUUID } from "node:crypto";

export function createTraceId(seed?: string): string {
  if (!seed) {
    return randomUUID();
  }

  return createHash("sha1").update(seed).digest("hex").slice(0, 24);
}
