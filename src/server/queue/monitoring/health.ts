import { getExecutionQueue } from "@/server/queue/producers/execution-producer";

export type QueueHealthSnapshot = {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
};

export async function getExecutionQueueHealth(): Promise<QueueHealthSnapshot> {
  const queue = getExecutionQueue();
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
  );

  return {
    name: queue.name,
    counts: {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      paused: counts.paused ?? 0,
    },
  };
}
