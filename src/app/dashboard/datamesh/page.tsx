import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { DataMeshPlayground } from "@/components/dashboard/datamesh/datamesh-playground";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function DashboardDataMeshPage(): Promise<JSX.Element> {
  await requireOrganizationRole("MEMBER");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Web Extraction API
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          DataMesh
        </h1>
        <p className="max-w-2xl text-sm text-slate-400 md:text-base">
          Universal Web-to-JSON Extraction API. Define a schema, get structured data
          from any URL. Power any pipeline.
        </p>
      </header>

      <DashboardCard
        title="Extraction Playground"
        description="Define your schema, hit any URL, get structured JSON back. Switch to API Reference for integration docs."
      >
        <DataMeshPlayground />
      </DashboardCard>
    </div>
  );
}
