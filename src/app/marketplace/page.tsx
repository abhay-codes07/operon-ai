import { MarketplaceSearchBar } from "@/components/marketplace/marketplace-search-bar";
import { TemplateCard } from "@/components/marketplace/template-card";
import { listTemplates } from "@/lib/marketplace/marketplace.service";

type MarketplacePageProps = {
  searchParams?: {
    query?: string;
    category?: string;
  };
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps): Promise<JSX.Element> {
  const data = await listTemplates({
    query: searchParams?.query,
    category: searchParams?.category,
    page: 1,
    pageSize: 30,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">OperonHub</p>
        <h1 className="text-2xl font-semibold text-slate-900">Marketplace Templates</h1>
        <p className="text-sm text-slate-600">Install proven autonomous web workflows and run them instantly.</p>
      </header>

      <MarketplaceSearchBar defaultQuery={searchParams?.query} defaultCategory={searchParams?.category} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((template) => (
          <TemplateCard
            key={template.id}
            template={{
              slug: template.slug,
              title: template.title,
              description: template.description,
              category: template.category,
              reliabilityScore: template.reliabilityScore,
              installCount: template.installCount,
              avgRating: template.avgRating,
              pricingModel: template.pricingModel,
              priceUsd: template.priceUsd,
            }}
          />
        ))}
      </div>
    </div>
  );
}
