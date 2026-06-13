import { Link } from "react-router-dom";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { useOrderStore } from "@/stores/orderStore";
import type { OrderStatus } from "@/stores/orderStore";

const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting Payment",
  awaiting_confirmation: "Awaiting Confirmation",
  confirmed: "Confirmed",
  assigned: "Assigned to Rider",
  picked_up: "Picked Up",
  out_for_delivery: "In Transit",
  delivered: "Delivered",
  received: "Received",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  awaiting_payment: "bg-amber-100 text-amber-700",
  awaiting_confirmation: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  assigned: "bg-blue-100 text-blue-700",
  picked_up: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  received: "bg-green-100 text-green-700",
};

export default function Orders() {
  const orders = useOrderStore((state) => state.orders);

  if (orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          No orders yet
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your orders will appear here after you place them
        </p>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-extrabold text-gray-900">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const itemCount = order.items.reduce(
            (sum, item) => sum + item.qty,
            0
          );

          const date = new Date(order.createdAt).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          );

          return (
            <Link
              key={order.id}
              to={`/orders/${order.id}/track`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-gray-300 group"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <Package className="h-6 w-6 text-orange-500" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    Order #{order.id}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      STATUS_COLORS[order.status]
                    }`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span>{date}</span>
                  <span>•</span>
                  <span>
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-gray-900">
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                className="flex-shrink-0 text-gray-300 transition group-hover:text-orange-500"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}