import React from "react";
import { ArrowRight, Gift, Plus } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Rice (50kg)",
    price: 2000,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
    stock: "In Stock",
  },
  {
    id: 2,
    name: "Beans 10kg",
    price: 9500,
    image:
      "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=500",
    stock: "In Stock",
  },
  {
    id: 3,
    name: "Sachet Water",
    price: 900,
    image:
      "https://images.unsplash.com/photo-1564419439288-bf9c7f9bdb53?w=500",
    stock: "Low Stock",
  },
  {
    id: 4,
    name: "Noodles 1ct",
    price: 1200,
    image:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500",
    stock: "In Stock",
  }, {
    id: 5,
    name: "Rice (50kg)",
    price: 2000,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
    stock: "In Stock",
  },
  {
    id: 6,
    name: "Beans 10kg",
    price: 9500,
    image:
      "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=500",
    stock: "In Stock",
  },
  {
    id: 7,
    name: "Sachet Water",
    price: 900,
    image:
      "https://images.unsplash.com/photo-1564419439288-bf9c7f9bdb53?w=500",
    stock: "Low Stock",
  },
  {
    id: 8,
    name: "Noodles 1ct",
    price: 1200,
    image:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=500",
    stock: "Out of Stock",
  },
];

export default function Homepage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Offer Banner */}
      {/* <section className="px-4 pt-4 md:px-6 lg:px-5">
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-primary-500 to-primary-700 p-5 text-white sm:flex-row sm:items-center sm:justify-between lg:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Gift size={20} />
              <h3 className="text-lg font-bold">
                Special Offer
              </h3>
            </div>

            <p className="mt-2 text-sm text-white/90">
              Free delivery on welfare orders!
            </p>
          </div>

          <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition hover:bg-white/30">
            <ArrowRight size={20} />
          </button>
        </div>
      </section> */}

      {/* Products */}
      <section className="p-4 md:p-6 lg:p-8">
        <div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:grid-cols-6 lg:gap-6 xl:grid-cols-5"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-30 w-full object-cover md:h-48 lg:h-56"
                />

                <span
                  className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm ${product.stock === "Out of Stock"
                      ? "bg-error"
                      : product.stock === "Low Stock"
                        ? "bg-accent"
                        : "bg-primary"
                    }
                  `}
                >
                  {product.stock}
                </span>
              </div>

              <div className="p-3 md:p-4">
                <h3 className="line-clamp-1 text-sm font-semibold md:text-base">
                  {product.name}
                </h3>

                <p className="mt-2 text-sm font-bold text-primary-40">
                  ₦{product.price.toLocaleString()}
                </p>

                <div className="mt-2 flex items-center justify-between">

                  <button
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-primary text-white transition hover:scale-110"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}