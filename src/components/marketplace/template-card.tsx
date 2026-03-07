import Link from "next/link";

import { InstallModal } from "@/components/marketplace/install-modal";

type TemplateCardProps = {
  template: {
    slug: string;
    title: string;
    description: string;
    category: string;
    reliabilityScore: number;
    installCount: number;
    avgRating: number;
    pricingModel: "FREE" | "PAID";
    priceUsd: number;
  };
};

export function TemplateCard({ template }: TemplateCardProps): JSX.Element {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{template.category}</p>
      <h3 className="mt-1 text-base font-semibold text-slate-900">{template.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{template.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <p>Reliability: {template.reliabilityScore.toFixed(1)}</p>
        <p>Installs: {template.installCount}</p>
        <p>Rating: {template.avgRating.toFixed(1)}</p>
        <p>
          {template.pricingModel === "FREE" ? "Free" : `$${template.priceUsd.toFixed(2)}`}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/marketplace/${template.slug}`}
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700"
        >
          View Details
        </Link>
        <InstallModal slug={template.slug} />
      </div>
    </article>
  );
}
