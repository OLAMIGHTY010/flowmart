import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus, Check, ShoppingCart, Loader2 } from 'lucide-react';
import { aiServices, type BundleRecommendation } from '@/services/AIServices';
import { useCartStore } from '@/stores/cartStore';

interface Props {
  productId: string;
}

export default function FrequentlyBoughtTogether({ productId }: Props) {
  const [bundle, setBundle] = useState<BundleRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    let isMounted = true;
    async function fetchBundle() {
      try {
        setLoading(true);
        const data = await aiServices.getFrequentlyBoughtTogether(productId, 2);
        if (isMounted) setBundle(data);
      } catch (err) {
        // Fallback silently if no bundle data
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (productId) {
      fetchBundle();
    }

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="my-8 rounded-2xl border border-gray-100 bg-gray-50/50 p-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-28 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!bundle || bundle.bundledProducts.length === 0) {
    return null;
  }

  const handleAddBundle = () => {
    if (!bundle) return;
    
    // Add primary item
    if (bundle.primaryProduct) {
      addToCart({
        id: bundle.primaryProduct.id,
        sku: bundle.primaryProduct.sku || bundle.primaryProduct.id || '',
        name: bundle.primaryProduct.name,
        description: bundle.primaryProduct.description || '',
        price: parseFloat(bundle.primaryProduct.price) || 0,
        stockQuantity: bundle.primaryProduct.stockQuantity || 10,
        imageUrl: bundle.primaryProduct.images?.[0] || bundle.primaryProduct.imageUrl || '',
      });
    }

    // Add bundled items
    bundle.bundledProducts.forEach((item) => {
      addToCart({
        id: item.id,
        sku: item.id || '',
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        stockQuantity: item.stockQuantity || 10,
        imageUrl: item.images?.[0] || '',
      });
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <section className="my-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-amber-50/30 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Frequently Bought Together</h3>
          <p className="text-xs text-gray-500">AI-curated bundle recommendation</p>
        </div>
        {bundle.bundleDiscountPercent > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Save {bundle.bundleDiscountPercent}% with Bundle
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Visual Product Thumbnails Chain */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Product */}
          <div className="group relative flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3 shadow-xs transition hover:shadow-md w-32">
            <img
              src={bundle.primaryProduct.images?.[0] || bundle.primaryProduct.imageUrl || 'https://placehold.co/100x100?text=FlowMart'}
              alt={bundle.primaryProduct.name}
              className="h-20 w-20 rounded-lg object-cover bg-gray-50"
            />
            <span className="mt-2 line-clamp-1 text-xs font-medium text-gray-700 text-center">
              This Item
            </span>
            <span className="text-xs font-bold text-primary">
              ₦{Number(bundle.primaryProduct.price).toLocaleString()}
            </span>
          </div>

          {/* Plus separator */}
          {bundle.bundledProducts.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Plus className="h-3.5 w-3.5" />
              </span>

              <Link
                to={`/products/${item.id}`}
                className="group relative flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3 shadow-xs transition hover:shadow-md w-32"
              >
                <img
                  src={item.images?.[0] || 'https://placehold.co/100x100?text=Item'}
                  alt={item.name}
                  className="h-20 w-20 rounded-lg object-cover bg-gray-50"
                />
                <span className="mt-2 line-clamp-1 text-xs font-medium text-gray-700 text-center group-hover:text-primary">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-primary">
                  ₦{Number(item.price).toLocaleString()}
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* Pricing & 1-Click Action */}
        <div className="flex flex-col items-center lg:items-start lg:ml-auto border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
          <div className="text-center lg:text-left">
            <span className="text-xs text-gray-500">Bundle Total Price:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-gray-900">
                ₦{bundle.bundleTotalPrice.toLocaleString()}
              </span>
              {bundle.bundleDiscountPercent > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  ₦{bundle.originalTotalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {bundle.savingsAmount > 0 && (
              <p className="text-xs font-medium text-emerald-600 mt-0.5">
                You save ₦{bundle.savingsAmount.toLocaleString()} today
              </p>
            )}
          </div>

          <button
            onClick={handleAddBundle}
            disabled={added}
            className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition w-full lg:w-auto ${
              added ? 'bg-emerald-600' : 'bg-primary hover:opacity-90'
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Bundle Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add Bundle to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
