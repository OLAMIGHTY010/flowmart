import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/services/api";
import { useCartStore } from "@/stores/cartStore";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
  };
}

export default function Wishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; wishlist: WishlistItem[] }>("/wishlist");
      setWishlist(res.wishlist || []);
    } catch (error) {
      console.error("Error fetching wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await apiClient.post("/wishlist/toggle", { productId });
      setWishlist((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error("Error removing from wishlist", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Heart className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Please Log In</h1>
        <p className="mt-2 text-gray-500">You must be logged in to view your wishlist.</p>
        <Link to="/login" className="mt-6 rounded-xl bg-primary/90 px-8 py-3 font-semibold text-white transition hover:bg-primary-700">
          Login
        </Link>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-in fade-in zoom-in duration-500">
        <Heart className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Your wishlist is empty</h1>
        <p className="mt-2 text-gray-500">Save items you love to view them later.</p>
        <Link to="/" className="mt-6 rounded-xl bg-primary/90 px-8 py-3 font-semibold text-white transition hover:bg-primary-700">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary/20" />
          My Wishlist
        </h1>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {wishlist.length} Items
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {wishlist.map((item) => (
          <Card key={item.id} className="group overflow-hidden rounded-2xl border-none shadow-md hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src={item.product.images?.[0] || "https://placehold.co/400"}
                alt={item.product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                onClick={() => removeFromWishlist(item.product.id)}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-400 shadow-sm backdrop-blur-sm transition-colors hover:text-red-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <Link to={`/product/${item.product.id}`}>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-primary/90 transition-colors">
                  {item.product.name}
                </h3>
              </Link>
              <p className="mt-2 text-xl font-extrabold text-primary/90">
                ₦{parseFloat(item.product.price).toLocaleString()}
              </p>
              <button
                onClick={() => {
                  const p = item.product as any;
                  addToCart({
                    id: p.id,
                    sku: p.sku || p.id,
                    vendorId: p.vendorId || '',
                    name: p.name,
                    description: p.description || '',
                    price: parseFloat(p.price),
                    imageUrl: p.images?.[0] || "",
                    stockQuantity: p.stockQuantity || 10,
                  } as any, 1);
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
