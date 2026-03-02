import type { MembershipRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/server/auth/session";

const roleRank: Record<MembershipRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export async function requireAuthenticatedUser() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  return session.user;
}

export async function requireOrganizationRole(requiredRole: MembershipRole) {
  const user = await requireAuthenticatedUser();

  if (!user.role || roleRank[user.role] < roleRank[requiredRole]) {
    redirect("/dashboard?error=insufficient-role");
  }

  return user;
}
