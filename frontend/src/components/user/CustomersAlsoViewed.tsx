import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useRecommendationStore } from "@/stores/recommendationStore";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import { Card } from "@/components/ui/card";
import ProductCard from "./product/ProductCard";

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