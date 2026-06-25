import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Truck, Apple, Shirt, Home as HomeIcon,
  Heart, Sparkles, Monitor, ArrowRight, Star, ChevronRight,
  Store, Users, Package, Zap, Loader2
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const categoryIconMap: Record<string, any> = {
  "groceries": Apple,
  "electronics": Monitor,
  "phones & tablets": Monitor,
  "fashion": Shirt,
  "home, furniture and appliances": HomeIcon,
  "health": Heart,
  "beauty": Sparkles,
};

const categoryColorMap: Record<string, string> = {
  "groceries": "text-green-700 border-green-700",
  "electronics": "text-blue-600 border-blue-600",
  "phones & tablets": "text-blue-600 border-blue-600",
  "fashion": "text-orange-600 border-orange-600",
  "home, furniture and appliances": "text-teal-600 border-teal-600",
  "health": "text-red-600 border-red-600",
  "beauty": "text-amber-600 border-amber-600",
};

const Homepage = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data: productsData, isLoading: productsLoading, isFetching } = useQuery({
    queryKey: ["homepage-products", activeCategory, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (activeCategory && activeCategory !== "All") {
        params.set("category", activeCategory);
      }
      return apiClient.get<{ success: boolean; products: any[]; meta: any }>(`/products?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["homepage-categories"],
    queryFn: () => apiClient.get<{ success: boolean; categories: string[] }>("/products/categories"),
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.meta?.total || 0;
  const hasMore = products.length >= LIMIT && (page * LIMIT) < totalProducts;
  const categories = (categoriesData?.categories || []).filter((c: string) => c !== "All");

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div>
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-[420px] flex items-center overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.6)_0%,rgba(5,46,22,0.85)_100%),url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80')] bg-center bg-cover bg-no-repeat">
        <div className="container mx-auto px-6 py-16 relative z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-500/20 rounded-full mb-4">
            <Zap size={14} className="text-green-300" />
            <span className="text-xs font-semibold text-green-300">
              Free delivery on your first order
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-white leading-[1.15] max-w-2xl mb-4">
            Anything You Need,{" "}
            <span className="text-green-300">Delivered Fast.</span>
          </h1>

          <p className="text-base text-white/80 max-w-md leading-relaxed mb-8">
            Shop thousands of products from trusted vendors and get them delivered to your doorstep in minutes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link to="/get-started" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 text-base font-semibold rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">
              <ShoppingBag size={18} />
              Start Shopping
            </Link>
            {!user && (
              <>
                <Link to="/get-started" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 text-base font-semibold rounded-xl bg-transparent text-white border border-white/40 hover:bg-white/10 transition-colors">
                  <Truck size={18} />
                  Become a Rider
                </Link>
                <Link to="/get-started" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 text-base font-semibold rounded-xl bg-transparent text-white border border-white/40 hover:bg-white/10 transition-colors">
                  <Store size={18} />
                  Become a Vendor
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12">
            {[
              { label: "Active Vendors", value: "500+" },
              { label: "Products", value: "10K+" },
              { label: "Deliveries", value: "50K+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES — Jiji-style horizontal strip ═══ */}
      <section className="bg-white border-b border-gray-200 sticky top-[64px] z-40 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {["All", ...(categories.length > 0 ? categories : ["Groceries", "Phones & Tablets", "Electronics", "Fashion", "Home, Furniture and Appliances", "Health", "Beauty"])].map((cat: string) => {
              const key = cat.toLowerCase();
              const IconComp = key === "all" ? ShoppingBag : categoryIconMap[key] || ShoppingBag;
              
              const isActive = activeCategory === cat;
              
              // Map dynamic tailwind color classes
              const activeColorClass = key === "all" ? "text-slate-600 border-slate-600" : categoryColorMap[key] || "text-green-700 border-green-700";
              const inactiveColorClass = "text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300";
              const colorClass = isActive ? activeColorClass : inactiveColorClass;

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`flex items-center gap-2 px-5 py-3.5 whitespace-nowrap text-[13px] font-semibold bg-transparent border-b-2 transition-all cursor-pointer ${colorClass}`}
                >
                  <IconComp size={16} />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ALL PRODUCTS ═══ */}
      <section className="bg-gray-50 min-h-[60vh] py-12" id="products-section">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeCategory === "All" ? "All Products" : `${activeCategory} Products`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Shop the best items from our vendors
              </p>
            </div>
          </div>

          {productsLoading ? (
            <div className="flex justify-center p-16">
              <Loader2 size={32} className="text-green-600 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white rounded-2xl border border-gray-200">
              <Store size={40} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No Products Yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Vendors are setting up shop. Check back soon!
              </p>
              <Link to="/get-started" className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-green-600 text-white font-semibold rounded-full hover:bg-green-500 transition-colors">
                Become a Vendor <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product: any) => {
                const firstImage = product.imageUrl || (product.images ? product.images.split(",")[0] : null);
                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-decoration-none transition-transform hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Product image */}
                    <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                      {firstImage ? (
                        <img
                          src={firstImage.startsWith("http") ? firstImage : `https://flowmart-bucket.s3.amazonaws.com/${firstImage}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={32} className="text-gray-300" />
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      {product.category && (
                        <p className="text-[11px] text-green-600 font-bold uppercase tracking-wider mb-0.5">
                          {product.category}
                        </p>
                      )}
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 truncate">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-[15px] font-bold text-green-600">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₦{Number(product.oldPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                {isFetching ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ PROMO BANNER ═══ */}
      <section className="bg-green-600 py-10">
        <div className="container mx-auto flex flex-col items-center text-center px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Up to 30% off{" "}
            <span className="text-green-200 underline underline-offset-4">
              selected items
            </span>
          </h2>
          <p className="text-sm text-white/80 mb-5">
            Limited time offers on groceries, electronics, and more
          </p>
          <Link to="/products" className="bg-white text-green-600 px-7 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══ DELIVERY CTA — "Bet We Can" ═══ */}
      <section className="bg-slate-900 py-14">
        <div className="container mx-auto text-center px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Think We Can't Deliver It?{" "}
            <span className="text-amber-500">Bet We Can.</span>
          </h2>
          <p className="text-sm text-white/70 max-w-lg mx-auto mb-7 leading-relaxed">
            From fragile electronics to fresh farm produce — our verified riders deliver anything, anywhere, carefully.
          </p>

          {/* Delivery stats */}
          <div className="flex justify-center gap-4 flex-wrap mb-2">
            {[
              { icon: Package, label: "Same-day delivery" },
              { icon: Truck, label: "Real-time tracking" },
              { icon: Users, label: "Verified riders" },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <IconComp size={18} className="text-green-400" />
                  <span className="text-[13px] text-white font-medium">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SELL ON FLOWMART CTA ═══ */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-2xl p-10 flex items-center justify-between gap-8 flex-wrap border border-gray-200 shadow-sm">
            <div>
              <span className="text-xs font-bold text-green-600 uppercase tracking-widest">
                Become a Vendor
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1 mb-1">
                Sell on FlowMart
              </h2>
              <p className="text-sm text-gray-500">
                Reach thousands of buyers across Nigeria
              </p>
            </div>
            <Link to="/get-started" className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-500 transition-colors flex items-center gap-1.5">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
