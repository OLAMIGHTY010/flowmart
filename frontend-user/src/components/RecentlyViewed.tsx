import { useRef } from "react";
import { Link } from "react-router-dom";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
import { Card } from "./ui/card";

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
          const stockStatus =
            product.stockQuantity === 0
              ? "Out of Stock"
              : product.stockQuantity < 10
              ? "Low Stock"
              : "In Stock";

          return (
            <Card
              key={product.id}
              className="min-w-[180px] max-w-[180px] lex-shrink-0 overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <Link to={`/products/${product.id}`}>
                <div className="relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x400?text=No+Image";
                    }}
                    className="
                      h-40
                      w-full
                      object-cover
                      bg-gray-100
                    "
                  />

                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold text-white ${
                      stockStatus === "Out of Stock"
                        ? "bg-red-500"
                        : stockStatus === "Low Stock"
                        ? "bg-amber-500"
                        : "bg-green-600"
                    }`}
                  >
                    {stockStatus}
                  </span>
                </div>
              </Link>

              <div className="p-3">
                <Link to={`/products/${product.id}`}>
                  <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium text-gray-800 transition-colors hover:text-primary">
                    {product.name}
                  </h3>
                </Link>

                <p className="mt-2 text-lg font-bold text-primary">
                  ₦
                  {Number(
                    product.price
                  ).toLocaleString()}
                </p>

                {product.oldPrice && (
                  <p className="text-xs text-gray-500 line-through">
                    ₦
                    {Number(
                      product.oldPrice
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}