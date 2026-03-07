import { NextResponse } from "next/server";

export function structuredApiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status },
  );
}
