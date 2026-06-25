import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Loader2, ArrowLeft, Star, ChevronRight } from "lucide-react";
import { apiClient } from "@/services/api";
import ProductCard from "@/components/user/product/ProductCard";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number[]>([]);
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.get<{ success: boolean; products: any[] }>("/products"),
  });

  const products = data?.products || [];

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  
  const vendors = ["FlowMart Official", "Fresh Farms", "TechGadgets", "Everyday Essentials"];

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    if (priceMin) result = result.filter(p => Number(p.price) >= Number(priceMin));
    if (priceMax) result = result.filter(p => Number(p.price) <= Number(priceMax));
    
    if (sortBy === "price_asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      result.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    }

    return result;
  }, [products, searchTerm, categoryFilter, sortBy, priceMin, priceMax, ratingFilter, vendorFilter]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setSortBy("newest");
    setPriceMin("");
    setPriceMax("");
    setRatingFilter([]);
    setVendorFilter([]);
    setSearchTerm("");
  };

  const toggleRating = (rating: number) => {
    setRatingFilter(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]);
  };

  const toggleVendor = (vendor: string) => {
    setVendorFilter(prev => prev.includes(vendor) ? prev.filter(v => v !== vendor) : [...prev, vendor]);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="container mx-auto px-6 max-w-[1400px] pt-6">
        
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-500 text-sm flex items-center gap-1.5 hover:text-green-600 transition-colors">
            <ArrowLeft size={16} /> Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-sm text-gray-800 font-medium">Marketplace</span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-8 items-start">
          
          {/* ================= LEFT SIDEBAR ================= */}
          <div className="hidden lg:flex flex-col gap-8 w-full">
            
            {/* Categories */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-800">Categories</h3>
              <div className="flex flex-col gap-1">
                {categories.map((cat: any) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`flex justify-between items-center px-4 py-2.5 rounded-lg text-left transition-all font-medium capitalize ${
                        isActive ? "bg-green-600 text-white font-semibold" : "bg-transparent text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>{cat === "all" ? "All Categories" : cat}</span>
                      {isActive && <ChevronRight size={16} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-800">Sort by Price</h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { id: "price_asc", label: "Price: Low to High" },
                  { id: "price_desc", label: "Price: High to Low" },
                  { id: "newest", label: "Newest First" }
                ].map(sort => (
                  <label key={sort.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="sort" 
                      checked={sortBy === sort.id}
                      onChange={() => setSortBy(sort.id)}
                      className="w-4 h-4 text-green-600 accent-green-600"
                    />
                    <span className="text-[15px] text-gray-700">{sort.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-800">Price Range</h3>
              <div className="flex items-center gap-2.5">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-800">Rating</h3>
              <div className="flex flex-col gap-2.5">
                {[4, 3, 2, 1].map(stars => (
                  <label key={stars} className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={ratingFilter.includes(stars)}
                      onChange={() => toggleRating(stars)}
                      className="w-4 h-4 text-green-600 accent-green-600 rounded"
                    />
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} fill={i < stars ? "#f59e0b" : "transparent"} color={i < stars ? "#f59e0b" : "#d1d5db"} />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Vendors */}
            <div>
              <h3 className="text-base font-bold mb-3 text-gray-800">Vendors</h3>
              <div className="flex flex-col gap-2.5">
                {vendors.map(vendor => (
                  <label key={vendor} className="flex items-center gap-2.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={vendorFilter.includes(vendor)}
                      onChange={() => toggleVendor(vendor)}
                      className="w-4 h-4 text-green-600 accent-green-600 rounded"
                    />
                    <span className="text-[15px] text-gray-700">{vendor}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full p-3 border border-gray-200 rounded-full bg-white font-semibold text-gray-800 hover:bg-gray-50 transition-colors mt-2"
            >
              Clear all filters
            </button>

          </div>

          {/* ================= MAIN CONTENT ================= */}
          <div className="w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                  All Products
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredProducts.length} products found
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-full border border-gray-200 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-shadow"
                />
              </div>
            </div>

            {/* Promo Banner */}
            <div className="bg-slate-900 rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center mb-8 bg-[radial-gradient(circle_at_10%_50%,rgba(34,197,94,0.15)_0%,transparent_40%)] gap-6 sm:gap-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <Star size={24} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Get extra 10% off on selected items
                  </h3>
                  <p className="text-sm text-white/70">
                    Use code <span className="text-green-400 font-bold">SELECT10</span> at checkout
                  </p>
                </div>
              </div>
              <Link to="/products" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0">
                Shop now
              </Link>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-[40vh]">
                <Loader2 size={32} className="text-green-600 animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-5">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-5 bg-white rounded-2xl border border-dashed border-gray-200">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or search term to find what you're looking for.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2.5 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
