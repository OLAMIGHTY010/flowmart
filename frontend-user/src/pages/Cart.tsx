import React from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Cart() {
  const cart = useCartStore((state) => state.cart);
  const increaseQty = useCartStore((state) => state.increaseQty);
  const decreaseQty = useCartStore((state) => state.decreaseQty);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const getCartSubtotal = useCartStore((state) => state.getCartSubtotal);
  const getShippingFee = useCartStore((state) => state.getShippingFee);
  const getCartTotal = useCartStore((state) => state.getCartTotal);

  const subtotal = getCartSubtotal();
  const shipping = getShippingFee();
  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <ShoppingBag className="h-16 w-16 text-gray-400" />

        <h1 className="mt-4 text-xl font-semibold">
          Your cart is empty
        </h1>

        <p className="text-gray-500 mt-2">
          Add products to start shopping
        </p>

        <Link
          to="/"
          className="mt-6 rounded-lg bg-primary px-6 py-2 text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* LEFT - CART ITEMS */}
      <div className="lg:col-span-2 space-y-4">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Shopping Cart</h1>

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
            className="flex gap-4 p-2 shadow-sm"
          >
            {/* IMAGE */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-20 w-20 rounded-lg object-cover"
            />

            {/* DETAILS */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-primary font-bold">
                  ₦{Number(item.price).toLocaleString()}
                </p>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">

                  <button
                    onClick={() => decreaseQty(item.id)}
                    className="rounded-md border p-1"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="w-8 text-center">
                    {item.qty}
                  </span>

                  <button
                    onClick={() => increaseQty(item.id)}
                    className="rounded-md border p-1"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* TOTAL */}
            <div className="hidden sm:flex items-center font-semibold">
              ₦{(item.price * item.qty).toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* RIGHT - SUMMARY */}
      <Card className="h-fit p-5 shadow-sm">

        <h2 className="text-lg font-bold mb-4">
          Order Summary
        </h2>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
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

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">
              ₦{total.toLocaleString()}
            </span>
          </div>

        </div>

        {/* CHECKOUT */}
        <Link
          to="/checkout"
          className="mt-6 block w-full rounded-lg bg-primary py-3 text-center text-white font-semibold hover:opacity-90 transition"
        >
          Proceed to Checkout
        </Link>

        <Link
          to="/"
          className="mt-3 block text-center text-sm text-gray-500 hover:underline"
        >
          Continue Shopping
        </Link>

      </Card>
    </div>
  );
}