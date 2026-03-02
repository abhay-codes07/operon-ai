"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type RetryExecutionButtonProps = {
  executionId: string;
  compact?: boolean;
};

export function RetryExecutionButton({ executionId, compact }: RetryExecutionButtonProps): JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRetry() {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/internal/executions/${executionId}/retry`, {
      method: "POST",
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Retry failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" onClick={onRetry} disabled={isLoading} className={compact ? "h-8 px-3 text-xs" : undefined}>
        {isLoading ? "Retrying..." : "Retry"}
      </Button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
