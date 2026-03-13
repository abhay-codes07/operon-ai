import { SandboxIdentitiesTable } from "@/components/sandbox/sandbox-identities-table";
import { SectionHeading } from "@/components/ui/section-heading";
import { listIdentitiesForOrg } from "@/lib/sandbox/identity-vault.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export default async function SandboxPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [identities, latestBlast] = await Promise.all([
    listIdentitiesForOrg(user.organizationId!),
    prisma.blastRadiusScore.findMany({
      where: { organizationId: user.organizationId! },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const averageBlast = latestBlast.length
    ? Math.round(latestBlast.reduce((sum, item) => sum + item.score, 0) / latestBlast.length)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-6">
      <SectionHeading
        eyebrow="Operon Sandbox Economy"
        title="Isolated Agent Identity Plane"
        description="Every workflow runs with a unique sandbox identity, isolated session storage, and scoped credentials."
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Average Blast Radius</p>
        <p className="text-lg font-semibold text-emerald-700">{averageBlast}/100</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Sandbox Identities</h2>
        <div className="mt-3">
          <SandboxIdentitiesTable
            items={identities.map((identity) => ({
              id: identity.id,
              email: identity.email,
              status: identity.status,
              fingerprintId: identity.fingerprintId,
              proxyId: identity.proxyId,
              workflow: {
                id: identity.workflow.id,
                name: identity.workflow.name,
              },
            }))}
          />
        </div>
      </section>
    </div>
  );
}
