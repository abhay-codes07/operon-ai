"use client";

import { Button } from "@/components/ui/button";

export default function DashboardWorkflowsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <p className="text-sm font-semibold text-rose-800">Workflows view failed to load</p>
      <p className="mt-1 text-sm text-rose-700">{error.message || "An unexpected error occurred."}</p>
      <Button className="mt-4" variant="secondary" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
