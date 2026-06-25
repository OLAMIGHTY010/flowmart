import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Phone,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOrder, useConfirmReceived } from "@/hooks/useOrders";
import { useRiderTracking } from "@/hooks/useRiderTracking";
import type { OrderStatus } from "@/types/order";
import { useEffect } from "react";

/* ── Leaflet icon fix (Vite bundler workaround) ── */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ── Custom rider icon ── */
const riderIcon = new L.DivIcon({
  html: `<div style="background:#16a34a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/* ── Auto-pan map to rider ── */
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center]);
  return null;
}

/* ── Status config ── */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned to Rider",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  assigned: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  picked_up: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  delivered: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order Placed" },
  { status: "confirmed", label: "Order Confirmed" },
  { status: "assigned", label: "Assigned to Rider" },
  { status: "picked_up", label: "Picked Up" },
  { status: "delivered", label: "Delivered" },
];

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "picked_up",
  "delivered",
];

/* ── Main Component ── */
export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useOrder(id!);
  const confirmReceivedMutation = useConfirmReceived();
  const { riderPosition, isConnected } = useRiderTracking(id);

  const order = data?.order;

  const defaultCenter: [number, number] = [6.5244, 3.3792];
  const mapCenter: [number, number] = riderPosition
    ? [riderPosition.lat, riderPosition.lng]
    : defaultCenter;

  useEffect(() => {
    if (confirmReceivedMutation.isSuccess) {
      const timer = setTimeout(() => {
        navigate("/products");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmReceivedMutation.isSuccess, navigate]);

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
          to="/orders"
          className="mt-4 text-sm font-semibold text-orange-500 hover:underline"
        >
          View all orders
        </Link>
      </div>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);
  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const itemCount = order.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

  const handleReceived = () => {
    confirmReceivedMutation.mutate(order.id);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
          Order Tracking
        </h1>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Left Column: Map, Order Card & Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Live Map */}
          <div className="relative h-52 sm:h-64 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <MapContainer
              center={mapCenter}
              zoom={15}
              scrollWheelZoom={false}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {riderPosition && (
                <>
                  <MapUpdater center={[riderPosition.lat, riderPosition.lng]} />
                  <Marker position={[riderPosition.lat, riderPosition.lng]} icon={riderIcon}>
                    <Popup>
                      <span className="text-xs font-bold">🚴 Rider Location</span>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>

            {/* Live badge overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-gray-800 shadow-sm border border-gray-100">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'animate-ping bg-green-400' : 'bg-gray-400'}`}></span>
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </span>
              {riderPosition ? "Live tracking" : isConnected ? "Waiting for rider..." : "Connecting..."}
            </div>
          </div>

          {/* Order Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                  Order #{order.id.substring(0, 8)}
                </h2>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColor.bg} ${statusColor.text}`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span>•</span>
              <span className="font-bold text-gray-900">
                ₦{Number(order.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer">
              <Phone size={16} className="text-green-600" />
              Call Rider
            </button>

            <Link
              to={`/order-confirmation/${order.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <FileText size={16} />
              View Receipt
            </Link>
          </div>
        </div>

        {/* Right Column: Progress Timeline & confirmation */}
        <div className="space-y-4 sm:space-y-6">
          {/* Delivery Progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <h3 className="mb-4 sm:mb-5 text-sm font-bold uppercase tracking-wider text-gray-400">
              Delivery Progress
            </h3>

            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => {
                const isCompleted = i <= currentStatusIdx;
                const isCurrent = i === currentStatusIdx;
                const isLast = i === TIMELINE_STEPS.length - 1;

                return (
                  <div key={step.status} className="relative flex gap-3 sm:gap-4">
                    {/* Vertical line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`relative z-10 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 transition ${
                          isCompleted
                            ? "border-green-500 bg-green-500"
                            : isCurrent
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={12} className="text-white sm:hidden" />
                            <CheckCircle2 size={14} className="text-white hidden sm:block" />
                          </>
                        ) : (
                          <Circle
                            size={10}
                            className={
                              isCurrent ? "text-white" : "text-gray-300"
                            }
                          />
                        )}
                      </div>

                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[28px] sm:min-h-[32px] ${
                            i < currentStatusIdx ? "bg-green-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-5 sm:pb-6 ${isLast ? "pb-0" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs sm:text-sm font-semibold ${
                            isCompleted || isCurrent
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Received Button */}
          {order.status === "delivered" && (
            <button
              onClick={handleReceived}
              disabled={confirmReceivedMutation.isPending}
              className="w-full rounded-xl bg-green-600 py-3.5 sm:py-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-green-700 cursor-pointer animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmReceivedMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Confirming...
                </span>
              ) : (
                "✅ Confirm Order Received"
              )}
            </button>
          )}

          {/* Received Confirmation */}
          {confirmReceivedMutation.isSuccess && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 animate-bounce" />
              <p className="mt-2 text-sm font-bold text-green-800">
                Order Received Successfully!
              </p>
              <p className="mt-1 text-xs text-green-600 font-medium">
                Thank you for shopping with FlowMart
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
