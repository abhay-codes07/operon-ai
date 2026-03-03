import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Invalid request payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      ),
    } as const;
  }

  return {
    data: parsed.data,
    error: null,
  } as const;
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  options: { min?: number; max?: number } = {},
) {
  const min = options.min ?? 1;
  const max = options.max ?? 200;
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}
