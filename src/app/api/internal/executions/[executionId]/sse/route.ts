import { z } from "zod";

import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchExecutionStream } from "@/server/services/control-plane/streaming-service";
import { prisma } from "@/server/db/client";

const paramsSchema = z.object({
  executionId: z.string().trim().min(1),
});

type RouteContext = {
  params: { executionId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireOrganizationRole("MEMBER");
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return new Response("Invalid execution identifier", { status: 400 });
  }

  const executionId = parsed.data.executionId;

  // Verify ownership
  const execution = await prisma.execution.findFirst({
    where: { id: executionId, organizationId: user.organizationId! },
    select: { status: true },
  });
  if (!execution) {
    return new Response("Execution not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let lastSequence = 0;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial burst of existing events
      const existing = await fetchExecutionStream({
        organizationId: user.organizationId!,
        executionId,
      });
      for (const event of existing) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
        if (event.sequence > lastSequence) lastSequence = event.sequence;
      }

      // Poll for new events every 1.5 seconds
      const poll = async () => {
        if (closed) return;
        try {
          const fresh = await prisma.execution.findFirst({
            where: { id: executionId },
            select: { status: true },
          });

          const newEvents = await fetchExecutionStream({
            organizationId: user.organizationId!,
            executionId,
            sinceSequence: lastSequence,
          });

          for (const event of newEvents) {
            if (event.sequence > lastSequence) {
              const data = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(data));
              lastSequence = event.sequence;
            }
          }

          // Send heartbeat
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));

          // Stop polling when execution is terminal
          if (fresh?.status === "SUCCEEDED" || fresh?.status === "FAILED" || fresh?.status === "CANCELED") {
            // Send final status event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ eventType: "execution.terminal", payload: { status: fresh.status } })}\n\n`),
            );
            controller.close();
            closed = true;
            return;
          }

          if (!closed) {
            setTimeout(() => void poll(), 1500);
          }
        } catch {
          if (!closed) {
            setTimeout(() => void poll(), 3000);
          }
        }
      };

      setTimeout(() => void poll(), 1500);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
