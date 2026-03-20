import { SandboxIdentitiesTable } from "@/components/sandbox/sandbox-identities-table";
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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 py-12">
        {/* Header Section */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-400">Operon Sandbox Economy</p>
          <h1 className="text-5xl font-bold">Isolated Agent Identity Plane</h1>
          <p className="text-lg text-slate-300 max-w-3xl">Every workflow runs with a unique sandbox identity, isolated session storage, and scoped credentials ensuring maximum security and isolation.</p>
        </div>

        {/* Blast Radius Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl p-6 border border-purple-700/50">
              <p className="text-slate-400 text-sm font-semibold mb-2">Average Blast Radius</p>
              <p className="text-4xl font-bold text-purple-400">{averageBlast}<span className="text-lg text-slate-400">/100</span></p>
              <p className="text-xs text-slate-500 mt-3">Lower is better - indicates smaller impact radius</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/50 rounded-xl p-6 border border-cyan-700/50">
              <p className="text-slate-400 text-sm font-semibold mb-2">Active Identities</p>
              <p className="text-4xl font-bold text-cyan-400">{identities.length}</p>
              <p className="text-xs text-slate-500 mt-3">Unique sandbox identities in use</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl p-6 border border-green-700/50">
              <p className="text-slate-400 text-sm font-semibold mb-2">Security Level</p>
              <p className="text-4xl font-bold text-green-400">High</p>
              <p className="text-xs text-slate-500 mt-3">Fully isolated execution environment</p>
            </div>
          </div>
        </div>

        {/* Identities Table Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Sandbox Identities</h2>
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
      </div>
    </main>
  );
}
