import { useNavigate, useOutletContext } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { useProducts } from "@/hooks/useProducts";

interface FilterContext {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  sort: string;
  setSort: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  quickFilters: string[];
  setQuickFilters: React.Dispatch<React.SetStateAction<string[]>>;
  offers: string[];
  setOffers: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Homepage() {
  const navigate = useNavigate();
  const {
    query,
    sort,
    selectedCategory,
    selectedTab,
    quickFilters,
    offers,
    setQuery,
    setSort,
    setSelectedCategory,
    setSelectedTab,
    setQuickFilters,
    setOffers,
  } = useOutletContext<FilterContext>();

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const {
    data: products = [],
    isLoading,
    isError,
  } = useProducts();

  const handleResetFilters = () => {
    setQuery("");
    setSort("default");
    setSelectedCategory("All");
    setSelectedTab("all");
    setQuickFilters([]);
    setOffers([]);
  };

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load products
      </div>
    );
  }

  // Filter products based on search query, selected tab, category, quick filters, and offers
  const filteredProducts = products.filter((product) => {
    // 1. Search Query Filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      const nameMatch = product.name?.toLowerCase().includes(lowerQuery);
      const descMatch = product.description?.toLowerCase().includes(lowerQuery);
      const catMatch = product.category?.toLowerCase().includes(lowerQuery);
      if (!nameMatch && !descMatch && !catMatch) {
        return false;
      }
    }

    // 2. Tab Filter
    if (selectedTab === "meals") {
      const mealCategories = ["meals", "fast food", "combos", "snacks"];
      if (!mealCategories.includes(product.category?.toLowerCase() || "")) {
        return false;
      }
    } else if (selectedTab === "groceries") {
      const groceryCategories = ["groceries", "dairy", "beverages", "drinks", "food", "welfare", "health"];
      if (!groceryCategories.includes(product.category?.toLowerCase() || "")) {
        return false;
      }
    }

    // 3. Category Filter
    if (selectedCategory && selectedCategory !== "All") {
      if (product.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    // 4. Quick Filters
    if (quickFilters.length > 0) {
      // "In Stock" -> stockQuantity > 0
      if (quickFilters.includes("In Stock") && product.stockQuantity <= 0) {
        return false;
      }
      // "Top Rated" -> Use product rating if available, otherwise default to 4
      if (quickFilters.includes("Top Rated")) {
        const rating = product.rating || 4;
        if (rating < 4) {
          return false;
        }
      }
      // "New Arrivals"
      if (quickFilters.includes("New Arrivals")) {
        // Assume products with isNew flag or just take a fallback
        if (product.isNew === false) {
          return false;
        }
      }
    }

    // 5. Offers Filters
    if (offers.length > 0) {
      // "Free Delivery" -> price >= 5000
      if (offers.includes("Free Delivery") && product.price < 5000) {
        return false;
      }
      // "Discount Deals" -> has oldPrice
      if (offers.includes("Discount Deals") && !product.oldPrice) {
        return false;
      }
      // "Bundle Offers" -> contains combo in category or name
      if (offers.includes("Bundle Offers")) {
        const isCombo = product.category?.toLowerCase().includes("combo") || product.name?.toLowerCase().includes("combo");
        if (!isCombo) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "price-asc") {
      return a.price - b.price;
    }
    if (sort === "price-desc") {
      return b.price - a.price;
    }
    if (sort === "stock") {
      return b.stockQuantity - a.stockQuantity;
    }
    return 0; // default Relevance
  });

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="px-1 py-2 md:p-6 lg:p-8">
        {sortedProducts.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-foreground">No products found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We couldn't find any products matching your current search or filter criteria. Try adjusting your selections.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 12 }).map(
                  (_, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden"
                    >
                      <div className="h-28 animate-pulse bg-gray-200 lg:h-36" />

                      <div className="p-3">
                        <div className="mb-2 h-4 animate-pulse rounded bg-gray-200" />

                        <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />

                        <div className="mb-3 h-5 w-1/2 animate-pulse rounded bg-gray-200" />

                        <div className="h-9 animate-pulse rounded-lg bg-gray-200" />
                      </div>
                    </Card>
                  )
                )
              : sortedProducts.map((product) => {
                  const stockStatus =
                    product.stockQuantity === 0
                      ? "Out of Stock"
                      : product.stockQuantity < 10
                      ? "Low Stock"
                      : "In Stock";

                  return (
                    <Card
                      key={product.id}
                      className="cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-md"
                      onClick={() =>
                        navigate(
                          `/products/${product.id}`
                        )
                      }
                    >
                      <div className="relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-28 w-full object-cover lg:h-36"
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

                      <div className="p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold">
                          {product.name}
                        </h3>

                        <p className="mt-1 font-bold text-primary">
                          ₦
                          {Number(
                            product.price
                          ).toLocaleString()}
                        </p>

                        {product.oldPrice && (
                          <p className="text-xs text-gray-500 line-through">
                            ₦
                            {product.oldPrice.toLocaleString()}
                          </p>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          disabled={
                            product.stockQuantity ===
                            0
                          }
                          className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {product.stockQuantity ===
                          0
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </button>
                      </div>
                    </Card>
                  );
                })}
          </div>
        )}
      </section>
    </div>
  );
}