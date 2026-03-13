import { prisma } from "@/server/db/client";

type CredentialVault = {
  domains?: string[];
  credentials?: Record<string, { username?: string; password?: string; token?: string }>;
};

function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase();
}

export async function setDomainCredential(input: {
  identityId: string;
  domain: string;
  username?: string;
  password?: string;
  token?: string;
}) {
  const identity = await prisma.sandboxIdentity.findUnique({
    where: { id: input.identityId },
    select: { credentialVault: true },
  });
  const vault = (identity?.credentialVault as CredentialVault | null) ?? { domains: [], credentials: {} };
  const domain = normalizeDomain(input.domain);

  const nextDomains = [...new Set([...(vault.domains ?? []), domain])];
  const nextCredentials = {
    ...(vault.credentials ?? {}),
    [domain]: {
      username: input.username,
      password: input.password,
      token: input.token,
    },
  };

  return prisma.sandboxIdentity.update({
    where: { id: input.identityId },
    data: {
      credentialVault: {
        domains: nextDomains,
        credentials: nextCredentials,
      },
    },
  });
}

export async function getDomainCredential(identityId: string, domain: string) {
  const identity = await prisma.sandboxIdentity.findUnique({
    where: { id: identityId },
    select: { credentialVault: true },
  });
  const vault = (identity?.credentialVault as CredentialVault | null) ?? { credentials: {} };
  const normalized = normalizeDomain(domain);
  const record = vault.credentials?.[normalized];

  if (!record) {
    throw new Error("Domain credential not found for sandbox identity");
  }

  return record;
}

export async function assertDomainCredentialScope(identityId: string, domain: string) {
  const identity = await prisma.sandboxIdentity.findUnique({
    where: { id: identityId },
    select: { credentialVault: true },
  });
  const vault = (identity?.credentialVault as CredentialVault | null) ?? { domains: [] };
  const allowedDomains = (vault.domains ?? []).map(normalizeDomain);
  const normalized = normalizeDomain(domain);

  if (!allowedDomains.includes(normalized)) {
    throw new Error(`Sandbox credential scope violation for domain ${domain}`);
  }

  return true;
}
