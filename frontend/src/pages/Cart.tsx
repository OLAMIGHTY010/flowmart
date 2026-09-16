import { Link } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import CustomersAlsoViewed from "@/components/CustomersAlsoViewed";
import RecentlyViewed from "@/components/RecentlyViewed";

export default function Cart() {
  const cart = useCartStore((state) => state.cart);

  const increaseQty = useCartStore(
    (state) => state.increaseQty
  );

  const decreaseQty = useCartStore(
    (state) => state.decreaseQty
  );

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const subtotal = useCartStore(
    (state) => state.getCartSubtotal()
  );

  const shipping = useCartStore(
    (state) => state.getShippingFee()
  );

  const total = useCartStore(
    (state) => state.getCartTotal()
  );

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[calc(60vh-100px)] lg:h-screen flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400" />

        <h1 className="mt-3 text-xl font-semibold">
          Your cart is empty
        </h1>

        <p className="mt-2 text-gray-500">
          Add products to start shopping
        </p>

        <Link
          to="/"
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">

      {/* CART + SUMMARY */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* CART ITEMS */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              Shopping Cart ({cart.length})
            </h1>

            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:underline"
            >
              Clear Cart
            </button>
          </div>

          {cart.map((item) => (
            <Card
              key={item.id}
              className="flex gap-4 p-3"
            >
              {/* IMAGE */}
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-24 w-24 rounded-lg object-cover"
              />

              {/* DETAILS */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>

                  <p className="font-bold text-primary">
                    ₦
                    {Number(
                      item.price
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() =>
                        decreaseQty(item.id)
                      }
                      className="rounded-md border p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="w-8 text-center">
                      {item.qty}
                    </span>

                    <button
                      onClick={() =>
                        increaseQty(item.id)
                      }
                      className="rounded-md border p-1"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                  </div>

                  <button
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                    className="text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* ITEM TOTAL */}
              <div className="hidden items-center font-semibold sm:flex">
                ₦
                {(
                  Number(item.price) *
                  item.qty
                ).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>

        {/* ORDER SUMMARY */}
        <Card className="h-fit p-5">
          <h2 className="mb-4 text-lg font-bold">
            Order Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                ₦{subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {shipping === 0
                  ? "Free"
                  : `₦${shipping.toLocaleString()}`}
              </span>
            </div>

            <hr />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>

              <span className="text-primary">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>

          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-semibold text-white"
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/"
            className="mt-3 block text-center text-sm text-gray-500"
          >
            Continue Shopping
          </Link>
        </Card>
      </div>

      {/* RECENTLY VIEWED */}
      <div className="mt-8">
        <RecentlyViewed />
      </div>

      <hr className="mt-8 border-gray-100 w-screen left-1/2 -ml-[50vw] -mr-[50vw relative" />

      {/* CUSTOMERS ALSO VIEWED */}
      <div className="mt-8">
        <CustomersAlsoViewed />
      </div>

    </div>
  );
}