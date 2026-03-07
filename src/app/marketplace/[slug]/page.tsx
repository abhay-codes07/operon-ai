import { notFound } from "next/navigation";

import { TemplateActions } from "@/components/marketplace/template-actions";
import { TemplateReviewList } from "@/components/marketplace/template-review-list";
import { getTemplateBySlug } from "@/lib/marketplace/marketplace.service";

type MarketplaceTemplateDetailPageProps = {
  params: {
    slug: string;
  };
};

export default async function MarketplaceTemplateDetailPage({
  params,
}: MarketplaceTemplateDetailPageProps): Promise<JSX.Element> {
  const template = await getTemplateBySlug(params.slug);
  if (!template) {
    notFound();
  }

  const latestVersion = template.versions.find((item) => item.isLatest) ?? template.versions[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{template.category}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{template.title}</h1>
        <p className="text-sm text-slate-600">{template.description}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>Reliability Score: {template.reliabilityScore.toFixed(1)}</p>
          <p>Install Count: {template.installCount}</p>
          <p>Avg Rating: {template.avgRating.toFixed(1)}</p>
          <p>Reviews: {template.reviewCount}</p>
        </div>
        <div className="mt-4">
          <TemplateActions slug={template.slug} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Workflow Preview</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
          {JSON.stringify(latestVersion?.workflowDefinition ?? {}, null, 2)}
        </pre>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Reviews</h2>
        <div className="mt-3">
          <TemplateReviewList
            reviews={template.reviews.map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt.toISOString(),
            }))}
          />
        </div>
      </section>
    </div>
  );
}
