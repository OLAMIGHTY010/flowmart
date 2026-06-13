import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingCart,
  User,
  Package,
  Utensils,
  ShoppingBag,
  Store,
  Laptop,
  Book,
  Shirt,
  Smartphone,
} from "lucide-react";

import logo from "@/assets/flowmart.png";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck } from "lucide-react";

type SortKey = "default" | "price-asc" | "price-desc" | "stock";

interface NavbarProps {
  query: string;
  setQuery: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  sort: SortKey;
  setSort: (value: SortKey) => void;
  selectedTab: string;
  setSelectedTab: (value: string) => void;
}

const tabs = [
  { key: "all", label: "All Items", icon: ShoppingBag },
  { key: "meals", label: "Meals", icon: Utensils },
  { key: "groceries", label: "Groceries", icon: Store },
  { key: "electronics", label: "Electronics", icon: Laptop }, 
  { key: "books", label: "Books", icon: Book },
  { key: "wears", label: "Wears", icon: Shirt },
  { key: "gadgets", label: "Gadgets", icon: Smartphone },
];

export default function Navbar({
  query,
  setQuery,
  showFilters,
  setShowFilters,
  selectedTab,
  setSelectedTab,
}: NavbarProps) {
  const cartCount = useCartStore((state) => state.getCartCount());
  const [searchFocused, setSearchFocused] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* ═══════════════════════════════════════════
          MOBILE + TABLET
         ═══════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 lg:hidden">
        {/* Top Row — Logo + Cart */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary-600">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Flowmart"
              className="h-10 w-30 rounded-lg object-cover"
            />
          </Link>

          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/25">
                  Sign up
                </Link>
              </>
            ) : (
              <Link to="/profile" className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border-2 border-white/20">
                <img src={user.avatar || "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&h=150&fit=crop&crop=faces"} alt={user.fullName} className="h-full w-full object-cover" />
              </Link>
            )}
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-white" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-40 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="border-t border-primary-500/20 px-4 py-3 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`flex flex-1 items-center gap-2 rounded-full border px-3 py-2.5 transition-all ${
              searchFocused ? "border-primary ring-2 ring-primary/20 bg-white" : "border-border bg-gray-100"
            }`}>
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                type="text"
                placeholder="Search for products, meals, and more"
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
              className={`rounded-xl border p-2.5 transition-all ${
                showFilters
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="overflow-x-auto border-t border-border bg-white">
          <div className="flex min-w-max gap-0 px-2">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedTab(key)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedTab === key
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {selectedTab === key && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DESKTOP
         ═══════════════════════════════════════════ */}
      <div className="hidden border-b border-border bg-background sticky top-0 z-50 lg:block">
        {/* Main Header */}
        <div className="mx-auto flex h-16 max-w-full items-center gap-6 px-8 xl:px-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logo}
              alt="Flowmart"
              className="h-14 w-52 rounded-non object-cover"
            />
          </Link>

          {/* Search */}
          <div className="flex flex-1 max-w-2xl">
            <div className={`flex flex-1 items-center rounded-full border px-4 transition-all ${
              searchFocused
                ? "border-primary ring-2 ring-primary/15 bg-white shadow-sm"
                : "border-border bg-gray-100/80"
            }`}>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for products, meals, and more"
                className="h-10 w-full bg-transparent px-3 text-sm outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="shrink-0">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Sign up for free delivery
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 mr-2">
                <div className="flex items-center gap-2 hidden md:flex bg-gray-50 rounded-full pl-1 pr-3 py-1 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                  <img 
                    src={user.avatar || "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&h=150&fit=crop&crop=faces"} 
                    alt={user.fullName} 
                    className="w-7 h-7 rounded-full object-cover border border-white"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-bold text-gray-900 leading-none">{user.fullName.split(" ")[0]}</span>
                    {user.isVerified && (
                      <div className="flex items-center gap-0.5 mt-0.5 text-[9px] font-bold uppercase text-green-600">
                        <ShieldCheck size={10} /> Verified
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-px h-6 bg-border mx-2" />

            <Link
              to="/profile"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            >
              <User className="h-4 w-4" />
              Account
            </Link>

            <Link
              to="/orders"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            >
              <Package className="h-4 w-4" />
              Orders
            </Link>

            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-full items-center px-8 xl:px-16">
            <div className="flex items-center gap-0">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedTab(key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                    selectedTab === key
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {selectedTab === key && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  showFilters
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}