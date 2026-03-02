import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const seedEmail = process.env.SEED_OWNER_EMAIL ?? "owner@webops.ai";
  const seedPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";
  const seedOrgName = process.env.SEED_ORGANIZATION_NAME ?? "WebOps Demo Org";
  const seedOrgSlug = process.env.SEED_ORGANIZATION_SLUG ?? "webops-demo-org";

  const existingUser = await prisma.user.findUnique({
    where: { email: seedEmail.toLowerCase() },
  });

  if (existingUser) {
    console.log(`Seed skipped: user already exists for ${seedEmail}`);
    return;
  }

  const passwordHash = await hash(seedPassword, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: seedEmail.toLowerCase(),
        name: "WebOps Owner",
        passwordHash,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: seedOrgName,
        slug: seedOrgSlug,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
  });

  console.log(`Seed complete: ${seedEmail} in organization ${seedOrgName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
