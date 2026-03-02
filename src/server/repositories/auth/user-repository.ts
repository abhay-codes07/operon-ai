import type { MembershipRole, Organization, User } from "@prisma/client";

import { prisma } from "@/server/db/client";

type CreateUserWithOrgInput = {
  email: string;
  passwordHash: string;
  name?: string;
  organizationName: string;
  organizationSlug: string;
  role?: MembershipRole;
};

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUserWithOrganization(
  input: CreateUserWithOrgInput,
): Promise<{ user: User; organization: Organization }> {
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        name: input.name,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug: input.organizationSlug,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: input.role ?? "OWNER",
      },
    });

    return { user, organization };
  });

  return created;
}

export async function getPrimaryMembership(userId: string): Promise<
  | {
      organizationId: string;
      organizationName: string;
      role: MembershipRole;
    }
  | null
> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    return null;
  }

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}
