import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, ShieldCheck, Star, Users, CheckCircle2 } from "lucide-react";
import { useVendorProducts } from "@/hooks/useVendorProducts";
import ProductCard from "@/components/product/PurchaseCard";
import { useVendorStore } from "@/stores/vendorStore";

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: products, isLoading } = useVendorProducts(id!);
  
  const { followVendor, unfollowVendor, isFollowing } = useVendorStore();
  const following = isFollowing(id || "");

  const handleToggleFollow = () => {
    if (following) unfollowVendor(id!);
    else followVendor(id!);
  };

  // Extract vendor info from the first product or use mock fallback
  const vendor = products?.[0]?.vendor || {
    id: id || "v1",
    name: "FlowMart Official Store",
    logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&h=150",
    verified: true,
    rating: 4.8,
    totalProducts: products?.length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Vendor Header Card */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Cover Banner */}
        <div className="h-32 w-full bg-gradient-to-r from-green-500 to-green-700 md:h-48" />

        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            {/* Logo and Basic Info */}
            <div className="-mt-12 flex flex-col md:-mt-16 md:flex-row md:items-end md:gap-6">
              <div className="h-24 w-24 overflow-hidden rounded-xl border-4 border-white bg-white shadow-md md:h-32 md:w-32">
                <img
                  src={vendor.logo}
                  alt={vendor.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-4 md:mt-0 md:mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-gray-900">{vendor.name}</h1>
                  {vendor.verified && <ShieldCheck size={20} className="text-green-500" />}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>Lagos, Nigeria</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3 md:mb-2 md:mt-0">
              <button
                onClick={handleToggleFollow}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold shadow-sm transition md:w-auto cursor-pointer ${
                  following
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {following ? (
                  <>
                    <CheckCircle2 size={18} />
                    Following
                  </>
                ) : (
                  <>Follow Vendor</>
                )}
              </button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Star size={16} className="text-orange-400 fill-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Seller Score</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900">{vendor.rating?.toFixed(1) || "4.8"}</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Followers</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900">{following ? "1,245" : "1,244"}</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Order Fulfillment</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900">98%</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <ShieldCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Quality Rating</span>
              </div>
              <p className="text-xl font-extrabold text-gray-900">High</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Products Grid */}
      <div className="mt-8">
        <h2 className="mb-6 text-xl font-extrabold text-gray-900">All Products</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
            No products found for this vendor.
          </div>
        )}
      </div>
    </div>
  );
}
