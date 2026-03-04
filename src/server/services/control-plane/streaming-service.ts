import IORedis from "ioredis";

import {
  createExecutionStreamEvent,
  getLatestExecutionStreamSequence,
  listExecutionStreamEvents,
} from "@/server/repositories/control-plane/control-plane-repository";
import { getAppEnv } from "@/config/env";

const CONTROL_PLANE_CHANNEL = "operon:control-plane:events";

let publisherClient: IORedis | null = null;

function getPublisher() {
  if (publisherClient) {
    return publisherClient;
  }

  publisherClient = new IORedis(getAppEnv().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  return publisherClient;
}

export function getControlPlaneChannelName() {
  return CONTROL_PLANE_CHANNEL;
}

export async function publishExecutionStreamEvent(input: {
  organizationId: string;
  executionId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const nextSequence = (await getLatestExecutionStreamSequence(input.organizationId, input.executionId)) + 1;
  const event = await createExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    sequence: nextSequence,
    eventType: input.eventType,
    payload: input.payload,
  });

  await getPublisher().publish(
    CONTROL_PLANE_CHANNEL,
    JSON.stringify({
      organizationId: event.organizationId,
      executionId: event.executionId,
      sequence: event.sequence,
      eventType: event.eventType,
      payload: event.payload,
      occurredAt: event.occurredAt,
    }),
  );

  return event;
}

export async function fetchExecutionStream(input: {
  organizationId: string;
  executionId: string;
  sinceSequence?: number;
}) {
  return listExecutionStreamEvents(input);
}
