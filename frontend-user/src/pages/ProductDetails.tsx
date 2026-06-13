import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import PurchaseCard from "@/components/product/PurchaseCard";
import CustomersAlsoViewed from "@/components/CustomersAlsoViewed";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useProduct } from "@/hooks/useProduct";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
// import VendorCard from "@/components/product/VendorCard";
import ProductReviews from "@/components/product/ProductReviews";

export default function ProductDetails() {
  const { id } = useParams();

  const { data, isLoading } =
    useProduct(id!);

  const addViewedProduct = useRecentlyViewedStore(
    (state) => state.addViewedProduct
  );

  useEffect(() => {
    if (data) {
      addViewedProduct(data);
    }
  }, [data, addViewedProduct]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-orange-500 hover:underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-0 py-6">
      {/* Breadcrumbs / Back button */}
      <div className="mb-4">
        <Link to="/" className="text-sm font-semibold text-orange-500 hover:underline">
          ← Back to Homepage
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Main Product Box (Gallery + Info) */}
        <div className="lg:col-span-9  grid gap-6 md:grid-cols-12">
          <div className="md:col-span-6">
            <ProductGallery
              key={data.id}
              images={
                data.images?.length
                  ? data.images
                  : [data.imageUrl]
              }
            />
          </div>

          <div className="md:col-span-6">
            <ProductInfo product={data} />
            {/* <VendorCard vendor={data.vendor} /> */}
          </div>
        </div>

        {/* Purchase Card Column */}
        <div className="lg:col-span-3">
          <PurchaseCard product={data} />
        </div>
      </div>

      <RecentlyViewed />

      <hr className="border-gray-200 mt-3" />

      <CustomersAlsoViewed currentProduct={data} />

      <ProductReviews productId={data.id} />
    </div>
  );
}