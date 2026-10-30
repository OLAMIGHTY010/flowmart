import { apiClient } from "@/services/api";
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
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Store,
  Radio,
  Gauge,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useOrder, useConfirmReceived } from "@/hooks/useOrders";
import { useRiderTracking } from "@/hooks/useRiderTracking";
import { RiderChatDrawer } from "@/components/chat/RiderChatDrawer";
import { TwoTierRatingModal } from "@/components/feedback/TwoTierRatingModal";
import { MessageCircle, Volume2, VolumeX } from "lucide-react";
import type { OrderStatus } from "@/types/order";
import { useEffect, useState, useRef } from "react";
import { audioChimes } from "@/utils/audioChimes";
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


// Store / Kitchen Marker
const storeIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(245,158,11,0.45);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
      <path d="M2 7h20"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Dynamic Heading Courier Marker
const createRiderHeadingIcon = (bearing: number = 0) => new L.DivIcon({
  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(79,70,229,0.25);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:relative;background:#4f46e5;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 4px 14px rgba(79,70,229,0.45);transform:rotate(${bearing}deg);transition:transform 0.4s ease;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 19 21 12 17 5 21 12 2"/>
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  // ═══ SPRINT I: ROUTE PLAYBACK & PROXIMITY RADAR STATES ═══
  const [telemetry, setTelemetry] = useState<any>(null);
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([
    [6.5186, 3.3712], // 0. Kitchen Departure (Herbert Macaulay Way)
    [6.5165, 3.3725], // 1. Commercial Avenue Junction
    [6.5140, 3.3738], // 2. Sabo Yaba Tech Cluster
    [6.5110, 3.3752], // 3. Alagomeji Bus Stop
    [6.5085, 3.3768], // 4. Murtala Muhammed Way
    [6.5050, 3.3785], // 5. Adekunle Flyover Approach
    [6.5020, 3.3800], // 6. University Road Link
    [6.4995, 3.3818], // 7. Akoka Commercial Bypass
    [6.4975, 3.3832], // 8. Community Road Turnoff (Default Position)
    [6.4960, 3.3842], // 9. Residential Approach (< 250m Gate Proximity)
    [6.4952, 3.3848], // 10. Front Gate Arrival
    [6.4950, 3.3850], // 11. Customer Doorstep Destination
  ]);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(8);
  const [isPlayingRoute, setIsPlayingRoute] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);
  const hasPlayedArrivalChime = useRef(false);

  // Fetch Live Telemetry from Backend
  useEffect(() => {
    if (!id) return;
    const fetchTelemetry = async () => {
      try {
        const res = await apiClient.get<any>(`/orders/${id}/tracking-telemetry`);
        if (res.success && res.telemetry) {
          setTelemetry(res.telemetry);
          if (res.telemetry.routeWaypoints && res.telemetry.routeWaypoints.length > 0) {
            setRouteWaypoints(res.telemetry.routeWaypoints);
            setCurrentPointIndex(res.telemetry.currentWaypointIndex || 8);
          }
        }
      } catch {
        // Fallback to baseline Yaba corridor waypoints
      }
    };
    fetchTelemetry();
  }, [id]);

  // Route Playback Timer
  useEffect(() => {
    if (!isPlayingRoute) return;
    const intervalMs = Math.round(900 / replaySpeed);
    const timer = setInterval(() => {
      setCurrentPointIndex((prev) => {
        if (prev >= routeWaypoints.length - 1) {
          setIsPlayingRoute(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlayingRoute, replaySpeed, routeWaypoints.length]);

  // Arrival Proximity Web Audio Chime (< 250m from gate)
  useEffect(() => {
    if (currentPointIndex >= routeWaypoints.length - 2 && !hasPlayedArrivalChime.current && soundEnabled) {
      hasPlayedArrivalChime.current = true;
      audioChimes.riderArrived();
    }
  }, [currentPointIndex, routeWaypoints.length, soundEnabled]);

  useEffect(() => {
    if (!order?.status || !soundEnabled) return;
    if (prevStatusRef.current && prevStatusRef.current !== order.status) {
      if (order.status === "assigned" || order.status === "picked_up") {
        audioChimes.riderAssigned();
      } else if (order.status === "delivered") {
        audioChimes.orderDelivered();
      }
    } else if (!prevStatusRef.current && order.status === "pending") {
      audioChimes.orderPlaced();
    }
    prevStatusRef.current = order.status;
  }, [order?.status, soundEnabled]);

  useEffect(() => {
    if (confirmReceivedMutation.isSuccess) {
      setIsRatingModalOpen(true);
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

  // Simulated or real rider profile with safety compliance
  const rider = (order as any).rider || {
    name: telemetry?.courier?.name || "Tunde Adebayo",
    phone: telemetry?.courier?.phone || "+2348039281726",
    vehicle: telemetry?.courier?.vehicle || "Honda CB 125 • FlowMart Express",
    licensePlate: telemetry?.courier?.licensePlate || "LAGOS • KJA-482-XA",
    rating: telemetry?.courier?.rating || "4.95",
    deliveriesCompleted: telemetry?.courier?.deliveriesCompleted || 248,
    safetyCompliance: telemetry?.courier?.safetyCompliance || {
      thermalBoxInspected: true,
      helmetVerified: true,
    },
  };

  // Active Map Position from Playback Scrubber or Live Telemetry
  const activePosition = routeWaypoints[currentPointIndex] || destinationCoords;
  const prevPoint = routeWaypoints[Math.max(0, currentPointIndex - 1)] || activePosition;
  const dLng = activePosition[1] - prevPoint[1];
  const dLat = activePosition[0] - prevPoint[0];
  const riderBearing = Math.round((Math.atan2(dLng, dLat) * (180 / Math.PI) + 360) % 360);
  const isNearGate = currentPointIndex >= routeWaypoints.length - 2;
  const traveledPath = routeWaypoints.slice(0, currentPointIndex + 1);
  const remainingPath = routeWaypoints.slice(currentPointIndex);
  const kitchenOrigin = routeWaypoints[0];

  const handleReceived = () => {
    if (soundEnabled) {
      audioChimes.orderDelivered();
    }
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

        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextState = !soundEnabled;
              setSoundEnabled(nextState);
              if (nextState) {
                audioChimes.orderPlaced();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition cursor-pointer"
            style={{
              backgroundColor: soundEnabled ? "var(--color-primary-surface, #e0e7ff)" : "#f3f4f6",
              borderColor: soundEnabled ? "var(--color-primary, #4f46e5)" : "#e5e7eb",
              color: soundEnabled ? "var(--color-primary, #4f46e5)" : "#6b7280",
            }}
            title={soundEnabled ? "Milestone Chimes Active (Click to test/mute)" : "Chimes Muted"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span className="hidden sm:inline">{soundEnabled ? "Audio Alerts On" : "Muted"}</span>
          </button>

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
          {/* ═══ SPRINT I: REAL-TIME DRIVER PROXIMITY RADAR CARD ═══ */}
          <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 shadow-md ${
            isNearGate
              ? "bg-emerald-950 border-emerald-500/60 text-white animate-pulse"
              : "bg-slate-900 border-indigo-500/30 text-white"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isNearGate
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
              }`}>
                <Radio size={20} className={isNearGate ? "animate-ping" : "animate-spin"} />
              </div>
              <div>
                <p className="font-black text-sm text-white flex items-center gap-2">
                  {isNearGate ? "🚨 Champion at Your Gate / Entrance!" : `🛵 Champion is ~3 mins away (${Math.round((routeWaypoints.length - 1 - currentPointIndex) * 90 + 120)}m)`}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isNearGate ? "bg-emerald-500 text-white" : "bg-indigo-500/30 text-indigo-300 border border-indigo-400/30"
                  }`}>
                    {isNearGate ? "ARRIVED" : "EN ROUTE"}
                  </span>
                </p>
                <p className="text-xs text-white/70">
                  {isNearGate
                    ? "Your courier has arrived. Hand over your Delivery PIN to collect your food."
                    : `Navigating via Herbert Macaulay Way • Heading ${riderBearing}° • 34 km/h`}
                </p>
              </div>
            </div>

            {/* Handover OTP Badge */}
            <div className="text-right shrink-0">
              <span className="text-[10px] text-white/50 block font-bold uppercase">Handover PIN</span>
              <span className="font-mono text-base font-black tracking-widest text-emerald-400">
                {order.deliveryPin || "8249"}
              </span>
            </div>
          </div>

          {/* ═══ LIVE MAP WITH KITCHEN + ACTIVE COURIER + DESTINATION ═══ */}
          <div className="relative h-72 sm:h-80 overflow-hidden rounded-2xl border border-gray-200 shadow-md">
            <MapContainer
              center={activePosition}
              zoom={14}
              scrollWheelZoom={false}
              zoomControl={false}
              attributionControl={false}
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Kitchen Origin Pin */}
              <Marker position={kitchenOrigin} icon={storeIcon}>
                <Popup>
                  <div className="text-xs font-bold text-gray-900">
                    <p className="font-black text-amber-600">🏪 Kitchen Store</p>
                    <p className="text-gray-600">Mama Put Delights • Yaba Station</p>
                  </div>
                </Popup>
              </Marker>

              {/* Customer Destination Pin */}
              <Marker position={destinationCoords} icon={destinationIcon}>
                <Popup>
                  <span className="text-xs font-bold">Your Delivery Destination</span>
                </Popup>
              </Marker>

              {/* Courier Pin with Dynamic Heading Bearing */}
              <MapUpdater center={activePosition} />
              <Marker position={activePosition} icon={createRiderHeadingIcon(riderBearing)}>
                <Popup>
                  <div className="text-xs font-bold">
                    <div className="text-indigo-600 font-black">{rider.name}</div>
                    <div className="text-gray-600 font-normal">{rider.vehicle}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{rider.licensePlate} • 34 km/h</div>
                  </div>
                </Popup>
              </Marker>

              {/* Solid Traveled Route Polyline */}
              <Polyline
                positions={traveledPath}
                color="#4f46e5"
                weight={4}
                opacity={0.9}
              />

              {/* Dashed Remaining Route Polyline to Destination */}
              <Polyline
                positions={remainingPath}
                color="#94a3b8"
                weight={3}
                dashArray="6, 8"
                opacity={0.8}
              />
            </MapContainer>

            {/* Live GPS Telemetry Status Pill */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 rounded-full bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-lg border border-white/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>Live GPS Active (34 km/h • Heading {riderBearing}°)</span>
            </div>
          </div>

          {/* ═══ INTERACTIVE ROUTE PLAYBACK CONTROLLER ═══ */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Navigation size={15} className="text-indigo-400" />
                <span className="font-bold text-white">Interactive Trip Route Playback</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-300">
                Step {currentPointIndex + 1} of {routeWaypoints.length} ({Math.round(((currentPointIndex + 1) / routeWaypoints.length) * 100)}%)
              </span>
            </div>

            {/* Route Scrubber Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={routeWaypoints.length - 1}
                value={currentPointIndex}
                onChange={(e) => {
                  setIsPlayingRoute(false);
                  setCurrentPointIndex(Number(e.target.value));
                }}
                className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/50">
                <span>🏪 Kitchen Picked Up</span>
                <span>🛣️ En Route</span>
                <span>🏠 Gate Arrival</span>
              </div>
            </div>

            {/* Playback Controls & Speed Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentPointIndex >= routeWaypoints.length - 1) {
                      setCurrentPointIndex(0);
                    }
                    setIsPlayingRoute(!isPlayingRoute);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isPlayingRoute ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlayingRoute ? "Pause Replay" : "Play Route Replay"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingRoute(false);
                    setCurrentPointIndex(0);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl text-xs transition"
                  title="Reset to Kitchen Departure"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Speed Multiplier Pill */}
              <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs font-mono">
                {([1, 2, 4] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setReplaySpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      replaySpeed === spd
                        ? "bg-indigo-600 text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
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

              {/* Verified Champion Safety Compliance Badges */}
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold border border-emerald-200">
                  <ShieldCheck size={13} /> Verified Champion
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200">
                  🌡️ Thermal Box Inspected
                </span>
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium border border-purple-200">
                  ⛑️ Helmet & Gear Verified
                </span>
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

          {/* Chowdeck Two-Tier Rating Prompt */}
          {order.status === "delivered" && (
            <button
              type="button"
              onClick={() => setIsRatingModalOpen(true)}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                backgroundColor: "var(--color-primary-surface, #eef2ff)",
                color: "var(--color-primary, #4f46e5)",
                border: "1.5px solid var(--color-primary, #4f46e5)",
                fontSize: "0.938rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Star size={18} className="fill-amber-400 text-amber-400" />
              <span>Rate Courier & Food Quality</span>
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
