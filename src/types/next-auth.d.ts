import type { MembershipRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId?: string;
      organizationName?: string;
      role?: MembershipRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string;
    organizationName?: string;
    role?: MembershipRole;
  }
}
