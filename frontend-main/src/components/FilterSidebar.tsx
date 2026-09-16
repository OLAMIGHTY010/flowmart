import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

export type SortKey = "default" | "price-asc" | "price-desc" | "stock";

interface FilterSidebarProps {
  sort: SortKey;
  setSort: (value: SortKey) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  quickFilters: string[];
  setQuickFilters: React.Dispatch<React.SetStateAction<string[]>>;
  offers: string[];
  setOffers: React.Dispatch<React.SetStateAction<string[]>>;
  categories: string[];
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  minPrice: string;
  setMinPrice: React.Dispatch<React.SetStateAction<string>>;
  maxPrice: string;
  setMaxPrice: React.Dispatch<React.SetStateAction<string>>;
  conditions: string[];
  setConditions: React.Dispatch<React.SetStateAction<string[]>>;
  isNegotiableFilter: boolean;
  setIsNegotiableFilter: React.Dispatch<React.SetStateAction<boolean>>;
}

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "default", label: "Relevance" },
  { key: "price-asc", label: "Lowest Price" },
  { key: "price-desc", label: "Highest Price" },
  { key: "stock", label: "Most Available" },
];

const quickFilterOptions = ["In Stock", "Top Rated", "New Arrivals"];
const offerOptions = ["Free Delivery", "Discount Deals", "Bundle Offers"];
const conditionOptions = [
  { id: 'new', label: 'Brand New' },
  { id: 'used_like_new', label: 'Used - Like New' },
  { id: 'used_good', label: 'Used - Good' },
  { id: 'used_fair', label: 'Used - Fair' }
];

export default function FilterSidebar({
  sort,
  setSort,
  selectedCategory,
  setSelectedCategory,
  quickFilters,
  setQuickFilters,
  offers,
  setOffers,
  categories,
  showFilters,
  setShowFilters,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  conditions,
  setConditions,
  isNegotiableFilter,
  setIsNegotiableFilter,
}: FilterSidebarProps) {
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((c) =>
      c.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const toggleQuickFilter = (filter: string) => {
    setQuickFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleOffer = (offer: string) => {
    setOffers((prev) =>
      prev.includes(offer)
        ? prev.filter((o) => o !== offer)
        : [...prev, offer]
    );
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[116px] self-start h-[calc(100vh-116px)] overflow-y-auto border-r border-border bg-background pr-1 pl-18 py-6">
        <h3 className="text-base font-bold text-foreground mb-5">Filters</h3>

        {/* Sort by */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Sort by</h4>
          <div className="flex flex-col gap-2.5">
            {sortOptions.map(({ key, label }) => (
              <label
                key={key}
                onClick={() => setSort(key)}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-colors ${sort === key
                    ? "border-primary bg-primary"
                    : "border-gray-300 group-hover:border-primary/50"
                    }`}
                >
                  {sort === key && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${sort === key
                    ? "font-semibold text-foreground"
                    : "text-gray-700 group-hover:text-foreground"
                    }`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Quick Filters */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Quick filters
          </h4>
          <div className="flex flex-wrap gap-2">
            {quickFilterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleQuickFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${quickFilters.includes(filter)
                  ? "border-primary bg-primary-50 text-primary font-semibold shadow-sm"
                  : "border-border text-gray-600 hover:border-primary/40 hover:text-primary"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Offers */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Offers</h4>
          <div className="flex flex-col gap-2.5">
            {offerOptions.map((offer) => (
              <label
                key={offer}
                onClick={() => toggleOffer(offer)}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${offers.includes(offer)
                    ? "border-primary bg-primary"
                    : "border-gray-300 group-hover:border-primary/50"
                    }`}
                >
                  {offers.includes(offer) && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-foreground transition-colors">
                  {offer}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Price Range (₦)</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Condition */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Condition</h4>
          <div className="flex flex-col gap-2.5">
            {conditionOptions.map((opt) => (
              <label
                key={opt.id}
                onClick={() => setConditions(prev => prev.includes(opt.id) ? prev.filter(c => c !== opt.id) : [...prev, opt.id])}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${conditions.includes(opt.id)
                    ? "border-primary bg-primary"
                    : "border-gray-300 group-hover:border-primary/50"
                    }`}
                >
                  {conditions.includes(opt.id) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-foreground transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-border mb-5" />

        {/* Negotiable */}
        <div className="mb-6">
          <label
            onClick={() => setIsNegotiableFilter(!isNegotiableFilter)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <span
              className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${isNegotiableFilter
                ? "border-primary bg-primary"
                : "border-gray-300 group-hover:border-primary/50"
                }`}
            >
              {isNegotiableFilter && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-foreground transition-colors">
              Negotiable Price Only
            </span>
          </label>
        </div>

        <hr className="border-border mb-5" />

        {/* Categories */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Categories
          </h4>

          {/* Search Categories */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-100 px-3 py-2 mb-3">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search for category"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {categorySearch && (
              <button onClick={() => setCategorySearch("")}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {filteredCategories.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${selectedCategory === category
                    ? "border-primary bg-primary"
                    : "border-gray-300 group-hover:border-primary/50"
                    }`}
                >
                  {selectedCategory === category && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-foreground transition-colors">
                  {category}
                </span>
              </label>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No categories found
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE FILTER DRAWER ── */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          {/* Drawer Panel */}
          <div className="absolute right-0 top-0 h-full w-[300px] max-w-[85vw] bg-background shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h3 className="text-base font-bold text-foreground">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-5">
              {/* Sort by */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Sort by
                </h4>
                <div className="flex flex-col gap-3">
                  {sortOptions.map(({ key, label }) => (
                    <label
                      key={key}
                      onClick={() => setSort(key)}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-colors ${sort === key
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                          }`}
                      >
                        {sort === key && (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${sort === key
                          ? "font-semibold text-foreground"
                          : "text-gray-700"
                          }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-border mb-5" />

              {/* Quick Filters */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Quick filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {quickFilterOptions.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => toggleQuickFilter(filter)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${quickFilters.includes(filter)
                        ? "border-primary bg-primary-50 text-primary font-semibold"
                        : "border-border text-gray-600"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-border mb-5" />

              {/* Offers */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Offers
                </h4>
                <div className="flex flex-col gap-3">
                  {offerOptions.map((offer) => (
                    <label
                      key={offer}
                      onClick={() => toggleOffer(offer)}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${offers.includes(offer)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                          }`}
                      >
                        {offers.includes(offer) && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-700">{offer}</span>
                    </label>
                  ))}
                </div>
              </div>

              <hr className="border-border mb-5" />

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Categories
                </h4>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-100 px-3 py-2 mb-3">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search for category"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  {filteredCategories.map((category) => (
                    <label
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors ${selectedCategory === category
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                          }`}
                      >
                        {selectedCategory === category && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground">
                Filters
              </h3>

              <button
                onClick={() => {
                  setSort("default");
                  setSelectedCategory("");
                  setQuickFilters([]);
                  setOffers([]);
                  setCategorySearch("");
                }}
                className="text-xs font-medium text-primary"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
