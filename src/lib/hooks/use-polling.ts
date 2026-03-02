"use client";

import { useEffect } from "react";

export function usePolling(task: () => Promise<void>, intervalMs: number, enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const run = async () => {
      if (!mounted) {
        return;
      }
      await task();
    };

    const interval = setInterval(() => {
      void run();
    }, intervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [enabled, intervalMs, task]);
}
