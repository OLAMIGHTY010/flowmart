import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Phone,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  ShieldCheck,
  Lock,
  Clock,
  Sparkles,
  MapPin,
  MessageSquare,
  AlertCircle,
  KeyRound,
  Check,
  Star,
  Motorbike,
  Bike,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOrder, useConfirmReceived } from "@/hooks/useOrders";
import { useRiderTracking } from "@/hooks/useRiderTracking";
import { RiderChatDrawer } from "@/components/chat/RiderChatDrawer";
import { MessageCircle } from "lucide-react";
import type { OrderStatus } from "@/types/order";
import { useEffect, useState } from "react";
import DisputeModal from "@/components/orders/DisputeModal";
import { InstantMicroDisputeCard } from "@/components/user/InstantMicroDisputeCard";
import { DiasporaGiftingCard } from "@/components/user/DiasporaGiftingCard";

// Fix Leaflet marker icons in React
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

// Chowdeck-Style Custom Rider Marker (FlowMart Indigo Theme)
const riderIcon = new L.DivIcon({
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(79,70,229,0.25);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:relative;background:#4f46e5;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(79,70,229,0.4);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/>
      </svg>
    </div>
  </div>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Destination Pin (House icon)
const destinationIcon = new L.DivIcon({
  html: `<div style="background:#111827;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,0.25);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
}

const STATUS_PROGRESS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "assigned",
  "picked_up",
  "delivered",
];

const CHOWDECK_MILESTONES = [
  { status: "pending", label: "Order Placed", desc: "Sent to vendor" },
  { status: "confirmed", label: "Preparing", desc: "Vendor accepted" },
  { status: "assigned", label: "Rider Assigned", desc: "Heading to store" },
  { status: "picked_up", label: "Out for Delivery", desc: "On the way" },
  { status: "delivered", label: "Delivered", desc: "Enjoy your order!" },
];

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useOrder(id!);
  const confirmReceivedMutation = useConfirmReceived();

  const order = data?.order;

  // Default coordinate: Lagos center
  const destinationCoords: [number, number] = [6.5244, 3.3792];

  const { riderPosition, isConnected, etaMinutes } = useRiderTracking(
    id,
    order?.status,
    destinationCoords
  );

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" style={{ color: "var(--color-primary)" }} />
          <span className="text-sm font-semibold text-gray-500">Loading order dispatch details...</span>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Package className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Order not found</h1>
        <Link to="/orders" className="mt-4 text-sm font-semibold text-primary hover:underline" style={{ color: "var(--color-primary)" }}>
          View all orders
        </Link>
      </div>
    );
  }

  const currentStatusIdx = STATUS_PROGRESS_ORDER.indexOf(order.status);
  const itemCount = order.items?.reduce((sum, item) => sum + item.qty, 0) || 0;

  // Chowdeck Dynamic Headline & ETA text
  const getStatusHeadline = () => {
    switch (order.status) {
      case "pending":
        return {
          title: "Order Placed! Waiting for merchant...",
          desc: "The vendor has received your order and is confirming preparation.",
          badge: "Awaiting Confirmation",
          eta: "~35 Mins",
        };
      case "confirmed":
        return {
          title: "Vendor is preparing your items 🍳",
          desc: "Everything is being freshly packed and inspected for quality.",
          badge: "In Kitchen / Packing",
          eta: "~25 Mins",
        };
      case "assigned":
        return {
          title: "Courier Assigned & Heading to Store 🛵",
          desc: "Your delivery rider is en route to pick up your package.",
          badge: "Rider En Route to Merchant",
          eta: "~20 Mins",
        };
      case "picked_up":
        return {
          title: "Courier is on the way to you! 📦",
          desc: "Your order has been picked up and is traveling to your delivery address.",
          badge: "Out for Delivery",
          eta: `~${etaMinutes} Mins Remaining`,
        };
      case "delivered":
        return {
          title: "Order Delivered! 🎉",
          desc: "Your package has been safely handed off. Please confirm receipt below.",
          badge: "Completed",
          eta: "Delivered",
        };
      case "cancelled":
        return {
          title: "Order Cancelled",
          desc: "This order was cancelled. Any charged funds will be refunded to your account.",
          badge: "Cancelled",
          eta: "N/A",
        };
      default:
        return {
          title: "Processing Order",
          desc: "Your order is being handled by FlowMart dispatch.",
          badge: "In Progress",
          eta: "~30 Mins",
        };
    }
  };

  const statusInfo = getStatusHeadline();

  // Simulated or real rider profile
  const rider = (order as any).rider || {
    name: "Tunde Adebayo",
    phone: "+2348039281726",
    vehicle: "Honda CB 125 • FlowMart Express",
    rating: "4.9",
    deliveriesCompleted: 215,
  };

  const handleReceived = () => {
    confirmReceivedMutation.mutate(order.id);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Live Order Tracking
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                #{order.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              FlowMart Express Real-Time Dispatch Network
            </p>
          </div>
        </div>

        {/* Chowdeck Live ETA Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 18px",
            borderRadius: 9999,
            backgroundColor: "var(--color-primary-surface, #e0e7ff)",
            color: "var(--color-primary, #4f46e5)",
            fontWeight: 800,
            fontSize: "0.875rem",
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.12)",
          }}
        >
          <Clock size={16} className={order.status === "picked_up" ? "animate-spin" : "animate-pulse"} />
          <span>{statusInfo.eta}</span>
        </div>
      </div>

      {/* Chowdeck Dynamic Status Headline Card */}
      <div
        className="mb-6 p-5 sm:p-6 rounded-2xl border"
        style={{
          backgroundColor: "var(--color-bg-primary, #ffffff)",
          borderColor: "var(--color-border, #e5e7eb)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                  color: "var(--color-primary, #4f46e5)",
                }}
              >
                {statusInfo.badge}
              </span>
              <span className="text-xs text-gray-400 font-medium">Updated live</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              {statusInfo.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
              {statusInfo.desc}
            </p>
          </div>

          {/* Delivery PIN Box (Chowdeck Essential Security Feature) */}
          {order.deliveryPin && order.status !== "delivered" && order.status !== "cancelled" && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: 14,
                backgroundColor: "var(--color-bg-secondary, #f9fafb)",
                border: "1.5px dashed var(--color-primary, #4f46e5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)" }}>
                <KeyRound size={14} />
                <span>DELIVERY PIN</span>
              </div>
              <div
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 900,
                  letterSpacing: "4px",
                  color: "var(--color-text-primary, #111827)",
                }}
              >
                {order.deliveryPin}
              </div>
              <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                Give to rider on arrival
              </span>
            </div>
          )}
        </div>

        {/* Chowdeck 5-Step Progress Bar */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
            {CHOWDECK_MILESTONES.map((step, idx) => {
              const isDone = idx <= currentStatusIdx;
              const isCurrent = idx === currentStatusIdx;

              return (
                <div key={step.status} className="flex flex-col items-center text-center">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.813rem",
                      fontWeight: 800,
                      marginBottom: 8,
                      transition: "all 0.3s ease",
                      backgroundColor: isDone
                        ? "var(--color-primary, #4f46e5)"
                        : "var(--color-bg-tertiary, #f3f4f6)",
                      color: isDone ? "#ffffff" : "var(--color-text-muted, #9ca3af)",
                      boxShadow: isCurrent ? "0 0 0 4px var(--color-primary-surface, #e0e7ff)" : "none",
                    }}
                  >
                    {isDone ? <Check size={16} strokeWidth={3} /> : idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: "0.813rem",
                      fontWeight: isDone ? 700 : 500,
                      color: isDone ? "var(--color-text-primary, #111827)" : "var(--color-text-muted, #9ca3af)",
                    }}
                    className="truncate max-w-[80px] sm:max-w-none"
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Live Map & Courier Profile */}
        <div className="space-y-6">
          {/* Live Map Card */}
          <div className="relative h-64 sm:h-72 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <MapContainer
              center={riderPosition ? [riderPosition.lat, riderPosition.lng] : destinationCoords}
              zoom={14}
              scrollWheelZoom={false}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Destination Pin */}
              <Marker position={destinationCoords} icon={destinationIcon}>
                <Popup>
                  <span className="text-xs font-bold">Your Delivery Destination</span>
                </Popup>
              </Marker>

              {/* Rider Pin */}
              {riderPosition && (
                <>
                  <MapUpdater center={[riderPosition.lat, riderPosition.lng]} />
                  <Marker position={[riderPosition.lat, riderPosition.lng]} icon={riderIcon}>
                    <Popup>
                      <div className="text-xs font-bold">
                        <div>{rider.name}</div>
                        <div className="text-gray-500 font-normal">{rider.vehicle}</div>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline
                    positions={[
                      [riderPosition.lat, riderPosition.lng],
                      destinationCoords,
                    ]}
                    color="#4f46e5"
                    weight={3}
                    dashArray="6, 8"
                  />
                </>
              )}
            </MapContainer>

            {/* Live GPS Status Pill */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-3.5 py-1.5 text-xs font-bold text-gray-800 shadow-md border border-gray-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "animate-ping bg-indigo-400" : "bg-gray-400"}`}></span>
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isConnected ? "bg-indigo-600" : "bg-gray-400"}`}></span>
              </span>
              <span>{riderPosition ? "Live GPS Telemetry" : isConnected ? "Courier Dispatch Connected" : "Reconnecting..."}</span>
            </div>
          </div>

          {/* Chowdeck-Style Rider Profile Card */}
          {(order.status === "assigned" || order.status === "picked_up" || order.status === "delivered") && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                        color: "var(--color-primary, #4f46e5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1.125rem",
                      }}
                    >
                      {rider.name.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-base">{rider.name}</h3>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star size={11} className="fill-amber-500 text-amber-500" />
                        {rider.rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{rider.vehicle}</p>
                    <p className="text-[11px] text-gray-400">{rider.deliveriesCompleted} successful deliveries</p>
                  </div>
                </div>

                {/* Direct Actions: Chat & Call Courier */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 16px",
                      borderRadius: 12,
                      backgroundColor: "var(--color-primary-surface, #eef2ff)",
                      color: "var(--color-primary, #4f46e5)",
                      border: "1.5px solid var(--color-primary, #4f46e5)",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.1)",
                    }}
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </button>

                  <a
                    href={`tel:${rider.phone}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 16px",
                      borderRadius: 12,
                      backgroundColor: "var(--color-primary, #4f46e5)",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                    }}
                  >
                    <Phone size={16} />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address & NIPOST Details Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
              Delivery Destination
            </h3>
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                  color: "var(--color-primary, #4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-extrabold text-gray-900">
                  {order.deliveryAddress || "Standard Delivery Destination"}
                </div>
                {order.deliveryZone && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 6,
                        backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                        color: "var(--color-primary, #4f46e5)",
                      }}
                    >
                      Zone: {order.deliveryZone}
                    </span>
                    {order.deliveryPostcode && (
                      <span className="text-xs font-bold text-gray-500">
                        Postcode: {order.deliveryPostcode}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items, Protection & Confirmation */}
        <div className="space-y-6">
          {/* Items Summary Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900">
                Order Items ({itemCount})
              </h3>
              <span className="text-sm font-extrabold text-gray-900">
                ₦{Number(order.totalAmount).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "var(--color-primary, #4f46e5)",
                        backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.qty}x
                    </span>
                    <span className="font-semibold text-gray-800">{item.name || item.productName}</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    ₦{(Number(item.price || item.unitPrice || 0) * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FlowMart Escrow Guarantee Badge */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 flex items-start gap-3">
            <span
              style={{
                padding: 8,
                borderRadius: 10,
                backgroundColor: "var(--color-primary-surface, #e0e7ff)",
                color: "var(--color-primary, #4f46e5)",
                display: "flex",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <ShieldCheck size={20} />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-indigo-950">
                  FlowMart Escrow Protection
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-200/70 text-indigo-900">
                  <Lock size={10} className="inline mr-0.5" /> SECURED
                </span>
              </div>
              <p className="text-xs text-indigo-800/80 leading-relaxed mt-1">
                Your payment of ₦{Number(order.totalAmount).toLocaleString()} is held securely in escrow. Funds are only settled to the merchant after your PIN is verified and delivery is confirmed.
              </p>
            </div>
          </div>

          {/* Chowdeck Delivery Confirmation Button */}
          {order.status === "delivered" && (
            <button
              onClick={handleReceived}
              disabled={confirmReceivedMutation.isPending}
              style={{
                width: "100%",
                padding: "16px 24px",
                borderRadius: 14,
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: confirmReceivedMutation.isPending ? "not-allowed" : "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
              }}
              className="transition hover:opacity-95"
            >
              {confirmReceivedMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Confirming Received...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm Order Received</span>
                </>
              )}
            </button>
          )}

          {confirmReceivedMutation.isSuccess && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 animate-bounce" />
              <p className="mt-2 text-sm font-extrabold text-green-900">
                Order Received Confirmed!
              </p>
              <p className="mt-1 text-xs text-green-700">
                Thank you for ordering with FlowMart Express
              </p>
            </div>
          )}

          {/* Action Buttons: View Receipt & Dispute */}
          <div className="flex gap-3">
            <Link
              to={`/order-confirmation/${order.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <FileText size={16} />
              View Receipt
            </Link>

            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/60 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 cursor-pointer"
            >
              <AlertCircle size={16} />
              Need Help?
            </button>
          </div>

          {/* Autonomous Operations: Instant Micro-Dispute Card */}
          <InstantMicroDisputeCard
            orderId={order.id}
            orderTotalNgn={Number(order.totalAmount)}
          />

          {/* Autonomous Operations: Diaspora Gifting Card */}
          <DiasporaGiftingCard
            cartTotalNgn={Number(order.totalAmount)}
          />
        </div>
      </div>

      {isDisputeModalOpen && (
        <DisputeModal
          orderId={order.id}
          onClose={() => setIsDisputeModalOpen(false)}
        />
      )}
    </div>
  );
}
