import { createServer } from "http";
import { URL } from "url";

import IORedis from "ioredis";
import { WebSocketServer, type WebSocket } from "ws";

import { getAppEnv } from "@/config/env";
import { getControlPlaneChannelName } from "@/server/services/control-plane/streaming-service";

type ClientSubscription = {
  socket: WebSocket;
  organizationId: string;
  executionId?: string;
};

const env = getAppEnv();
const port = Number(process.env.CONTROL_PLANE_WS_PORT ?? 3101);
const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
const subscriptions = new Set<ClientSubscription>();

server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "", "http://localhost");
  if (url.pathname !== "/control-plane") {
    socket.destroy();
    return;
  }

  const organizationId = url.searchParams.get("organizationId");
  const executionId = url.searchParams.get("executionId") ?? undefined;

  if (!organizationId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (client) => {
    const subscription: ClientSubscription = {
      socket: client,
      organizationId,
      executionId,
    };
    subscriptions.add(subscription);

    client.on("close", () => {
      subscriptions.delete(subscription);
    });
  });
});

async function run() {
  await redis.subscribe(getControlPlaneChannelName());
  redis.on("message", (_channel, raw) => {
    const parsed = JSON.parse(raw) as {
      organizationId: string;
      executionId: string;
      sequence: number;
      eventType: string;
      payload: Record<string, unknown>;
      occurredAt: string;
    };

    for (const subscription of subscriptions) {
      if (subscription.organizationId !== parsed.organizationId) {
        continue;
      }
      if (subscription.executionId && subscription.executionId !== parsed.executionId) {
        continue;
      }

      if (subscription.socket.readyState === subscription.socket.OPEN) {
        subscription.socket.send(JSON.stringify(parsed));
      }
    }
  });

  server.listen(port, () => {
    console.log(`Control plane websocket server listening on :${port}`);
  });
}

run().catch((error) => {
  console.error("Control plane websocket server failed", error);
  process.exit(1);
});
