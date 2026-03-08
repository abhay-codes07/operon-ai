type MonitoringTask = {
  competitorId: string;
  competitorName: string;
  website: string;
};

type MonitoringAgent = (task: MonitoringTask) => Promise<void>;

async function runWithConcurrency(
  tasks: MonitoringTask[],
  agent: MonitoringAgent,
  concurrency: number,
) {
  const queue = [...tasks];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        return;
      }
      await agent(next);
    }
  });
  await Promise.all(workers);
}

export async function launchParallelAgents(input: {
  tasks: MonitoringTask[];
  agents: MonitoringAgent[];
  concurrency?: number;
}) {
  const concurrency = input.concurrency ?? 3;
  for (const agent of input.agents) {
    await runWithConcurrency(input.tasks, agent, concurrency);
  }
}

export type { MonitoringTask, MonitoringAgent };
