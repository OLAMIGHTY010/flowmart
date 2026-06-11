import { Link } from "react-router";
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingCart,
  User,
  Package,
  Menu,
} from "lucide-react";
import { Input } from "./ui/input";

type SortKey = "default" | "price-asc" | "price-desc" | "stock";

interface MarketplaceNavbarProps {
  query: string;
  setQuery: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  cartCount?: number;
}

export default function MarketplaceNavbar({
  query,
  setQuery,
  showFilters,
  setShowFilters,
  sort,
  setSort,
  cartCount = 0,
}: MarketplaceNavbarProps) {
  return (
    <>
      {/* MOBILE + TABLET */}
      <div className="border-b border-border bg-background px-4 py-3 md:px-8 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-input px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search products..."
              className="w-full bg-transparent text-sm outline-none"
            />

            {query && (
              <button onClick={() => setQuery("")}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-xl border p-2.5 ${
              showFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>

          <Link
            to="/orders"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Cart
          </Link>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["default", "Default"],
              ["price-asc", "Price ↑"],
              ["price-desc", "Price ↓"],
              ["stock", "Most Stock"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key as SortKey)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  sort === key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP - JUMIA STYLE */}
      <div className="hidden lg:block border-b border-border bg-background">
        {/* Main Header */}
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-6">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-extrabold text-primary"
          >
            Flowmart
          </Link>

          {/* Search */}
          <div className="flex flex-1 gap-3">
            <div className="flex flex-1 items-center rounded-md border border-border px-4">
              <Search className="h-5 w-5 text-muted-foreground" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories and brands"
                className="h-12 w-full bg-transparent px-3 outline-none"
              />
            </div>

            <button className="rounded-md bg-primary px-8 font-semibold text-primary-foreground">
              SEARCH
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            <Link
              to="/account"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <User className="h-5 w-5" />
              Account
            </Link>

            <Link
              to="/orders"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Package className="h-5 w-5" />
              Orders
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-2 text-sm font-medium"
            >
              <ShoppingCart className="h-5 w-5" />

              Cart

              {cartCount > 0 && (
                <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Categories Row */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3">
            <button className="flex items-center gap-2 font-semibold">
              <Menu className="h-4 w-4" />
              Categories
            </button>

            <Link to="/food">Food</Link>
            <Link to="/drinks">Drinks</Link>
            <Link to="/welfare">Welfare</Link>
            <Link to="/health">Health</Link>

            <div className="ml-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-border px-6 py-3">
              <div className="mx-auto flex max-w-7xl gap-2">
                {[
                  ["default", "Default"],
                  ["price-asc", "Price ↑"],
                  ["price-desc", "Price ↓"],
                  ["stock", "Most Stock"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSort(key as SortKey)}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      sort === key
                        ? "bg-primary text-primary-foreground"
                        : "border border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}