import { PublishTemplateForm } from "@/components/marketplace/publish-template-form";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function MarketplacePublishPage(): Promise<JSX.Element> {
  await requireOrganizationRole("ADMIN");

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">OperonHub</p>
        <h1 className="text-2xl font-semibold text-slate-900">Publish Template</h1>
        <p className="text-sm text-slate-600">
          Publish production-grade TinyFish web agent workflows for marketplace installation.
        </p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <PublishTemplateForm />
      </section>
    </div>
  );
}
