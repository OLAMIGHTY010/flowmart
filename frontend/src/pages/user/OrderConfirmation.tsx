import { useParams, Link } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  Package,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Truck,
  Loader2,
} from "lucide-react";
import { useOrder } from "@/hooks/useOrders";

const STEPS = [
  { label: "Cart", icon: ShoppingCart },
  { label: "Checkout", icon: CreditCard },
  { label: "Confirmation", icon: CheckCircle2 },
  { label: "Tracking", icon: Truck },
];

export default function OrderConfirmation() {
  const { id } = useParams();
  const { data, isLoading, isError } = useOrder(id!);
  const order = data?.order;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Package className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Order not found
        </h1>
        <Link
          to="/"
          className="mt-4 text-sm font-semibold text-orange-500 hover:underline"
        >
          Go back to homepage
        </Link>
      </div>
    );
  }

  const isPending = order.status === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const isActive = i === 2;
          const isCompleted = i < 2;
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-semibold ${
                    isActive
                      ? "text-orange-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2 mb-5 h-[2px] w-6 sm:w-16 md:w-24 bg-gray-200">
                  <div
                    className={`h-full transition-all ${
                      i < 2 ? "w-full bg-green-500" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Success Animation */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-50" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
          Order Placed Successfully!
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your order <span className="font-bold text-gray-900">#{order.id.substring(0, 8)}</span> has been submitted
        </p>
      </div>

      {/* Status Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <Clock className="h-6 w-6 flex-shrink-0 text-amber-600 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {isPending
                ? "Awaiting Confirmation"
                : `Order ${order.status.replace("_", " ")}`}
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              {isPending
                ? "The vendor will confirm your order shortly."
                : "Your order is being processed."}
            </p>
          </div>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Order Details</h2>

        {/* Items */}
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">Qty: {item.qty}</p>
              </div>
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                ₦{(Number(item.price) * item.qty).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
          <div className="flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-extrabold text-orange-600">
              ₦{Number(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment & Delivery Info */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-gray-100 pt-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {order.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Delivery Zone
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {order.deliveryZone}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/orders/${order.id}/track`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-orange-600"
        >
          Track Order
          <ChevronRight size={16} />
        </Link>

        <Link
          to="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-3.5 text-sm font-bold uppercase tracking-wider text-gray-700 transition hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
