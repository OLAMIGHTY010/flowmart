import { Link } from "react-router-dom";
import { Package, ChevronRight, ShoppingBag, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import type { OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned to Rider",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  assigned: "bg-blue-100 text-blue-700",
  picked_up: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const { data: orders = [], isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Package className="h-16 w-16 text-red-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Failed to load orders</h1>
        <p className="mt-2 text-sm text-gray-500">Please check your connection and try again.</p>
      </div>
    );
  }

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
          const itemCount = order.items?.reduce(
            (sum, item) => sum + item.qty,
            0
          ) || 0;

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
                    Order #{order.id.substring(0, 8)}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
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
                    ₦{Number(order.totalAmount).toLocaleString()}
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