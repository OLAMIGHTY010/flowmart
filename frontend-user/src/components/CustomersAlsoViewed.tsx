import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useRecommendationStore } from "@/stores/recommendationStore";
import { useCartStore } from "@/stores/cartStore";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import { Card } from "./ui/card";

interface Props {
  currentProduct?: Product;
}

export default function CustomersAlsoViewed({
  currentProduct,
}: Props) {
  const products = useRecommendationStore(
    (state) => state.recommendations
  );

  const setRecommendations = useRecommendationStore(
    (state) => state.setRecommendations
  );

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const { data: allProducts = [] } = useProducts();

  useEffect(() => {
    if (allProducts.length > 0) {
      if (currentProduct) {
        const recommended = allProducts.filter(
          (p) =>
            p.category === currentProduct.category &&
            p.id !== currentProduct.id
        );

        if (recommended.length < 5) {
          const others = allProducts.filter(
            (p) =>
              p.id !== currentProduct.id &&
              !recommended.find(
                (r) => r.id === p.id
              )
          );

          recommended.push(...others);
        }

        setRecommendations(
          recommended.slice(0, 5)
        );
      } else if (products.length === 0) {
        setRecommendations(
          allProducts.slice(0, 5)
        );
      }
    }
  }, [
    allProducts,
    currentProduct,
    setRecommendations,
  ]);

  if (!products.length) return null;

  return (
    <section className="relative left-1/2 -ml-[50vw] -mr-[50vw] mt-8 w-screen bg-white p-4 lg:px-20">
      <div className="mb-4 flex items-center justify-between px-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Customers Also Viewed
          </h2>

          <p className="text-sm text-gray-500">
            Similar products you may like
          </p>
        </div>

        <Link
          to="/products"
          className="text-sm font-medium text-primary hover:underline"
        >
          View More
        </Link>
      </div>

      <div
        className="
          flex
          gap-4
          overflow-x-auto
          scroll-smooth
          snap-x
          snap-mandatory
          px-4
          pb-2
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:none]
          [scrollbar-width:none]
        "
      >
        {products.map((product: Product) => {
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
              <Link
                to={`/products/${product.id}`}
              >
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
                      stockStatus ===
                      "Out of Stock"
                        ? "bg-red-500"
                        : stockStatus ===
                          "Low Stock"
                        ? "bg-amber-500"
                        : "bg-green-600"
                    }`}
                  >
                    {stockStatus}
                  </span>
                </div>
              </Link>

              <div className="p-3">
                <Link
                  to={`/products/${product.id}`}
                >
                  <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium text-gray-800 hover:text-primary">
                    {product.name}
                  </h3>
                </Link>

                <p className="mt-2 text-lg font-bold text-primary">
                  ₦
                  {Number(
                    product.price
                  ).toLocaleString()}
                </p>

                {/* <button
                  onClick={() =>
                    addToCart(product)
                  }
                  disabled={
                    product.stockQuantity === 0
                  }
                  className="
                    mt-3
                    w-full
                    rounded-lg
                    bg-primary
                    py-2
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:opacity-90
                    disabled:cursor-not-allowed
                    disabled:bg-gray-300
                  "
                >
                  {product.stockQuantity === 0
                    ? "Out of Stock"
                    : "Add To Cart"}
                </button> */}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}