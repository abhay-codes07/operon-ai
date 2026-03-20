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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 px-6 py-12">
        {/* Header Section */}
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-400">OperonHub</p>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">Marketplace Templates</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Discover and install proven autonomous web workflows. Browse 1000+ community-built templates optimized for real-world scenarios.</p>
        </header>

        {/* Search Bar */}
        <div className="sticky top-0 z-20">
          <MarketplaceSearchBar defaultQuery={searchParams?.query} defaultCategory={searchParams?.category} />
        </div>

        {/* Templates Grid */}
        <div>
          {data.items.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No templates found matching your criteria.</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your search or browse all categories.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
