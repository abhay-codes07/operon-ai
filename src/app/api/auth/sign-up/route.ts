import { NextResponse } from "next/server";
import { z } from "zod";

import { toSlug } from "@/lib/utils/slug";
import { parseJsonBody } from "@/server/api/validation";
import {
  createUserWithOrganization,
  getUserByEmail,
} from "@/server/repositories/auth/user-repository";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { hashPassword } from "@/server/services/auth/password";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  organizationName: z.string().min(2).max(120),
});

export async function POST(request: Request) {
  const throttleResponse = enforceRateLimit(request, "auth:sign-up", {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (throttleResponse) {
    return throttleResponse;
  }

  const { data, error } = await parseJsonBody(request, signUpSchema);
  if (error) {
    return error;
  }

  const { email, password, fullName, organizationName } = data;
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  const slug = `${toSlug(organizationName)}-${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = await hashPassword(password);

  const { user, organization } = await createUserWithOrganization({
    email,
    passwordHash,
    name: fullName,
    organizationName,
    organizationSlug: slug,
    role: "OWNER",
  });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    },
    { status: 201 },
  );
}
