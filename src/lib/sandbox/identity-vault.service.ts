import { prisma } from "@/server/db/client";

function randomToken(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createSandboxIdentity(input: {
  organizationId: string;
  workflowId: string;
  workflowName: string;
}) {
  const slug = input.workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
  const email = `${slug || "workflow"}.${input.workflowId.slice(-6)}@sandbox.operon.ai`;
  const identity = await prisma.sandboxIdentity.upsert({
    where: { workflowId: input.workflowId },
    create: {
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      email,
      fingerprintId: randomToken("fp"),
      proxyId: randomToken("px"),
      status: "ACTIVE",
      credentialVault: {
        domains: [],
        credentials: {},
      },
    },
    update: {
      status: "ACTIVE",
      revokedAt: null,
    },
  });

  await prisma.workflow.updateMany({
    where: { id: input.workflowId, organizationId: input.organizationId },
    data: { sandboxIdentityId: identity.id },
  });

  return identity;
}

export async function revokeIdentity(identityId: string, reason = "manual_revoke") {
  return prisma.sandboxIdentity.update({
    where: { id: identityId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      credentialVault: {
        revokedReason: reason,
      },
    },
  });
}

export async function listIdentitiesForOrg(organizationId: string) {
  return prisma.sandboxIdentity.findMany({
    where: { organizationId },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      sessions: {
        orderBy: { lastActivity: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
