import { useRef } from "react";
import { Link } from "react-router-dom";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
import { Card } from "@/components/ui/card";
import ProductCard from "./product/ProductCard";

export default function RecentlyViewed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const products = useRecentlyViewedStore(
    (state) => state.products
  );

  if (!products.length) return null;

  return (
    <section className="relative left-1/2 -ml-[50vw] -mr-[50vw] mt-8 w-screen bg-white p-4 lg:px-20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Recently Viewed
          </h2>

          <p className="text-sm text-gray-500">
            Products you recently looked at
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product) => {
          return (
            <div key={product.id} className="min-w-[180px] max-w-[180px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          );
        })}
      </div>
    </section>
  );
}