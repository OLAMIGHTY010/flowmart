import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingCart,
  User,
  Package,
  Menu,
} from "lucide-react";

import logo from "@/assets/flowmart.png";

type SortKey = "default" | "price-asc" | "price-desc" | "stock";

interface NavbarProps {
  query: string;
  setQuery: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  cartCount?: number;
}

const categories = [
  "All",
  "Food",
  "Drinks",
  "Welfare",
  "Health",
];

export default function Navbar({
  query,
  setQuery,
  showFilters,
  setShowFilters,
  sort,
  setSort,
  cartCount = 0,
}: NavbarProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const sortOptions: [SortKey, string][] = [
    ["default", "Default"],
    ["price-asc", "Price ↑"],
    ["price-desc", "Price ↓"],
    ["stock", "Most Stock"],
  ];

  return (
    <>
      {/* MOBILE + TABLET */}
      <div className="sticky top-0 z-50 bg-primary lg:hidden">
        {/* Top Row */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Flowmart"
              className="h-10 w-40 rounded-lg object-cover"
            />
          </Link>

          <Link to="/cart" className="relative">
            <ShoppingCart className="h-6 w-6 text-secondary-foreground" />

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Search */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />

              <input
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
              className={`rounded-xl border p-2.5 transition-colors ${
                showFilters
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto border-t border-border">
          <div className="flex min-w-max gap-2 px-4 py-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-muted"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="border-t border-border px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
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

      {/* DESKTOP */}
      <div className="hidden border-b border-border bg-background sticky top-0 z-50 lg:block">
        {/* Main Header */}
        <div className=" mx-auto flex h-20 max-w-full items-center gap-6 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Flowmart"
              className="h-16 w-60 rounded-non object-cover"
            />
          </Link>

          {/* Search */}
          <div className="flex flex-1 gap-3">
            <div className="flex flex-1 items-center rounded-lg border border-border px-4 bg-white">
              <Search className="h-5 w-5 text-muted-foreground" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories and brands"
                className="h-12 w-full bg-transparent px-3 outline-none"
              />
            </div>

            <button className="rounded-lg bg-primary px-8 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              SEARCH
            </button>
          </div>

          {/* Right Actions */}
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
                <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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

            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-sm transition-colors ${
                  selectedCategory === category
                    ? "font-semibold text-primary"
                    : "hover:text-primary"
                }`}
              >
                {category}
              </button>
            ))}

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
                {sortOptions.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSort(key)}
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