import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Package,
  Phone,
  FileText,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOrderStore } from "@/stores/orderStore";
import type { OrderStatus, OrderTimeline } from "@/stores/orderStore";

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

/* ── Simulated rider position hook ── */
function useRiderPosition(status: OrderStatus) {
  // Simulated positions around Redemption City area
  const positions: Record<string, [number, number]> = {
    awaiting_payment: [6.6018, 3.2396],
    awaiting_confirmation: [6.6018, 3.2396],
    confirmed: [6.6025, 3.2410],
    assigned: [6.6040, 3.2430],
    picked_up: [6.6060, 3.2460],
    out_for_delivery: [6.6075, 3.2480],
    delivered: [6.6090, 3.2500],
    received: [6.6090, 3.2500],
  };

  const [pos, setPos] = useState<[number, number]>(positions[status] || [6.6018, 3.2396]);

  useEffect(() => {
    setPos(positions[status] || [6.6018, 3.2396]);
  }, [status]);

  return pos;
}

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
  awaiting_payment: "Awaiting Payment",
  awaiting_confirmation: "Awaiting Confirmation",
  confirmed: "Confirmed",
  assigned: "Assigned to Rider",
  picked_up: "Picked Up",
  out_for_delivery: "In Transit",
  delivered: "Delivered",
  received: "Received",
};

const STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  awaiting_payment: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  awaiting_confirmation: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  assigned: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  picked_up: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  out_for_delivery: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  delivered: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  received: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-600" },
};

function getCompletedIndex(
  timeline: OrderTimeline[],
  currentStatus: OrderStatus
): number {
  const statusOrder: OrderStatus[] = [
    "awaiting_payment",
    "awaiting_confirmation",
    "confirmed",
    "assigned",
    "picked_up",
    "out_for_delivery",
    "delivered",
    "received",
  ];
  return statusOrder.indexOf(currentStatus);
}

/* ── Main Component ── */
export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useOrderStore((state) =>
    state.orders.find((o) => o.id === id)
  );
  const markAsReceived = useOrderStore((state) => state.markAsReceived);
  const riderPos = useRiderPosition(order?.status || "awaiting_payment");

  // Delivery destination
  const deliveryPos: [number, number] = [6.6090, 3.2500];

  if (!order) {
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

  const completedIdx = getCompletedIndex(order.timeline, order.status);
  const statusColor = STATUS_COLORS[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  const handleReceived = () => {
    markAsReceived(order.id);
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
              center={riderPos}
              zoom={15}
              scrollWheelZoom={false}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={riderPos} />

              {/* Rider marker */}
              <Marker position={riderPos} icon={riderIcon}>
                <Popup>
                  <span className="text-xs font-bold">🚴 Rider Location</span>
                </Popup>
              </Marker>

              {/* Delivery destination marker */}
              <Marker position={deliveryPos}>
                <Popup>
                  <span className="text-xs font-bold">📍 Delivery Point</span>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Live badge overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-gray-800 shadow-sm border border-gray-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Live delivery map
            </div>
          </div>

          {/* Order Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                  Order #{order.id}
                </h2>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColor.bg} ${statusColor.text}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span>•</span>
              <span className="font-bold text-gray-900">
                ₦{order.total.toLocaleString()}
              </span>
            </div>

            {order.status === "out_for_delivery" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-semibold">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Est. arrival: 38 mins
              </div>
            )}
          </div>

          {/* Dev Simulator Panel */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-5 shadow-sm">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-600">
              Vendor & Rider Simulator (Dev Tool)
            </h3>
            <p className="mb-3 text-xs text-red-700 leading-normal">
              Click any step to simulate vendor approval or rider progress.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Approve Order", status: "confirmed" as OrderStatus },
                { label: "Assign Rider", status: "assigned" as OrderStatus },
                { label: "Pick Up", status: "picked_up" as OrderStatus },
                { label: "Out for Delivery", status: "out_for_delivery" as OrderStatus },
                { label: "Deliver Order", status: "delivered" as OrderStatus },
              ].map((btn) => (
                <button
                  key={btn.status}
                  onClick={() => useOrderStore.getState().updateOrderStatus(order.id, btn.status)}
                  className="rounded bg-white border border-red-200 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-red-800 transition hover:bg-red-100 cursor-pointer"
                >
                  {btn.label}
                </button>
              ))}
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
              {order.timeline.map((entry, i) => {
                const isCompleted = i <= completedIdx;
                const isCurrent = i === completedIdx;
                const isLast = i === order.timeline.length - 1;

                return (
                  <div key={entry.status} className="relative flex gap-3 sm:gap-4">
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
                          <CheckCircle2 size={12} className="text-white sm:hidden" />
                        ) : null}
                        {isCompleted ? (
                          <CheckCircle2 size={14} className="text-white hidden sm:block" />
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
                            i < completedIdx ? "bg-green-500" : "bg-gray-200"
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
                          {entry.label}
                        </p>
                        {entry.timestamp && (
                          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                            {entry.timestamp}
                          </span>
                        )}
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
              className="w-full rounded-xl bg-green-600 py-3.5 sm:py-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-green-700 cursor-pointer animate-pulse"
            >
              ✅ Confirm Order Received
            </button>
          )}

          {/* Received Confirmation */}
          {order.status === "received" && (
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
