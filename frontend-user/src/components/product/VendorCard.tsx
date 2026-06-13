import { Link } from "react-router-dom";
import { ChevronRight, ShieldCheck, Star } from "lucide-react";
import type { Vendor } from "@/types/product";

interface Props {
  vendor: Vendor;
}

export default function VendorCard({ vendor }: Props) {
  if (!vendor) return null;

  return (
    <Link
      to={`/vendor/${vendor.id}`}
      className="mt-6 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:bg-green-50"
    >
      <div className="flex items-center gap-4">
        {/* Vendor Logo */}
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-gray-100 bg-gray-50">
          {vendor.logo ? (
            <img
              src={vendor.logo}
              alt={vendor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-gray-400">
              {vendor.name?.charAt(0) || "V"}
            </span>
          )}
        </div>

        {/* Vendor Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-gray-900">{vendor.name}</h3>
            {vendor.verified && (
              <ShieldCheck size={14} className="text-green-500" />
            )}
          </div>
          
          <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1">
              <Star size={12} className="fill-orange-400 text-orange-400" />
              <span className="text-gray-900">{vendor.rating?.toFixed(1) || "New"}</span>
            </div>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>{vendor.totalProducts || 0} Products</span>
          </div>
        </div>
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition hover:bg-gray-200">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}