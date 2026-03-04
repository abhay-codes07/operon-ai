import {
  createExecutionControlCommand,
  listPendingExecutionControlCommands,
  markExecutionControlCommandApplied,
} from "@/server/repositories/control-plane/control-plane-repository";
import { prisma } from "@/server/db/client";
import { publishExecutionStreamEvent } from "@/server/services/control-plane/streaming-service";

export async function enqueueExecutionControlCommand(input: {
  organizationId: string;
  executionId: string;
  action: "PAUSE" | "RESUME" | "STEP" | "OVERRIDE_ACTION" | "STOP";
  reason?: string;
  payload?: Record<string, unknown>;
}) {
  const command = await createExecutionControlCommand(input);

  await publishExecutionStreamEvent({
    organizationId: input.organizationId,
    executionId: input.executionId,
    eventType: "control.command.queued",
    payload: {
      commandId: command.id,
      action: command.action,
      reason: command.reason ?? null,
    },
  });

  return command;
}

export async function applyPendingExecutionControlCommands(input: {
  organizationId: string;
  executionId: string;
}) {
  const commands = await listPendingExecutionControlCommands(input);

  for (const command of commands) {
    if (command.action === "PAUSE") {
      await prisma.execution.update({
        where: { id: input.executionId },
        data: { isPaused: true },
      });
    }

    if (command.action === "RESUME") {
      await prisma.execution.update({
        where: { id: input.executionId },
        data: { isPaused: false },
      });
    }

    if (command.action === "STEP") {
      await prisma.execution.update({
        where: { id: input.executionId },
        data: {
          stepCursor: {
            increment: 1,
          },
          isPaused: true,
        },
      });
    }

    if (command.action === "STOP") {
      await prisma.execution.update({
        where: { id: input.executionId },
        data: {
          status: "CANCELED",
          isPaused: false,
          finishedAt: new Date(),
        },
      });
    }

    if (command.action === "OVERRIDE_ACTION") {
      await prisma.execution.update({
        where: { id: input.executionId },
        data: {
          inputPayload: {
            ...(command.payload as Record<string, unknown> | null),
            overrideAppliedAt: new Date().toISOString(),
          },
        },
      });
    }

    await markExecutionControlCommandApplied(command.id);
    await publishExecutionStreamEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      eventType: "control.command.applied",
      payload: {
        commandId: command.id,
        action: command.action,
      },
    });
  }

  return commands.length;
}
