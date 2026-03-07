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
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Search templates"
      />
      <input
        name="category"
        defaultValue={defaultCategory}
        className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        placeholder="Category"
      />
      <button type="submit" className="h-10 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
        Search
      </button>
    </form>
  );
}
