import React from "react";
import { useCartStore } from "@/stores/cartStore";

const products = [
  {
    id: 1,
    name: "Rice (50kg)",
    price: 2000,
    imageUrl:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
    stock: "In Stock",
  },
  {
    id: 2,
    name: "Beans 10kg",
    price: 9500,
    imageUrl:
      "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=500",
    stock: "In Stock",
  },
  {
    id: 3,
    name: "Sachet Water",
    price: 900,
    imageUrl:
      "https://images.unsplash.com/photo-1564419439288-bf9c7f9bdb53?w=500",
    stock: "Low Stock",
  },
  {
    id: 4,
    name: "Noodles 1ct",
    price: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500",
    stock: "In Stock",
  },
];

export default function Homepage() {
  const addToCart = useCartStore((state) => state.addToCart);
  const getCartSubtotal = useCartStore(
    (state) => state.getCartSubtotal
  );

  const subtotal = getCartSubtotal();

  const handleAddToCart = (product: any) => {
    addToCart(product);
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="py-2 px-1 md:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-1"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-40 w-full object-cover"
              />

              <div className="p-3">
                <h3 className="text-sm font-semibold">
                  {product.name}
                </h3>

                <p className="mt-1 font-bold text-primary">
                  ₦{product.price.toLocaleString()}
                </p>

                <span
                  className={`text-xs font-semibold ${
                    product.stock === "Out of Stock"
                      ? "text-red-500"
                      : product.stock === "Low Stock"
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {product.stock}
                </span>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary py-2 text-white transition hover:scale-105"
                >
                  Add to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}