type MarketplaceSearchBarProps = {
  defaultQuery?: string;
  defaultCategory?: string;
};

export function MarketplaceSearchBar({
  defaultQuery,
  defaultCategory,
}: MarketplaceSearchBarProps): JSX.Element {
  return (
    <form method="GET" className="grid gap-2 md:grid-cols-[1fr,220px,120px]">
      <input
        name="query"
        defaultValue={defaultQuery}
        className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
        placeholder="Search templates"
      />
      <input
        name="category"
        defaultValue={defaultCategory}
        className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
        placeholder="Category"
      />
      <button type="submit" className="h-10 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 text-sm font-medium text-white">
        Search
      </button>
    </form>
  );
}
