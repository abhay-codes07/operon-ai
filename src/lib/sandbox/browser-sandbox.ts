import { prisma } from "@/server/db/client";

export async function startSandboxSession(input: {
  organizationId: string;
  identityId: string;
  domain: string;
  cookies?: Record<string, unknown>;
}) {
  return prisma.sandboxSession.create({
    data: {
      organizationId: input.organizationId,
      identityId: input.identityId,
      domain: input.domain,
      cookies: input.cookies ?? {},
    },
  });
}

export async function updateSandboxSessionActivity(sessionId: string, cookies?: Record<string, unknown>) {
  return prisma.sandboxSession.update({
    where: { id: sessionId },
    data: {
      cookies: cookies ?? {},
      lastActivity: new Date(),
    },
  });
}

export async function buildSandboxBrowserContext(identityId: string) {
  const identity = await prisma.sandboxIdentity.findUnique({
    where: { id: identityId },
    select: {
      id: true,
      email: true,
      fingerprintId: true,
      proxyId: true,
      status: true,
    },
  });

  if (!identity || identity.status !== "ACTIVE") {
    throw new Error("Sandbox identity unavailable");
  }

  return {
    sandboxIdentityId: identity.id,
    sandboxEmail: identity.email,
    fingerprintId: identity.fingerprintId,
    proxyId: identity.proxyId,
    isolatedCookieJar: `cookie-jar-${identity.id}`,
  };
}
