import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiClient } from "@/services/api";
import {
  Bike,
  Battery,
  AlertTriangle,
  RefreshCw,
  Search,
  Phone,
  Store,
  CheckCircle2,
  Radio,
  Clock,
  ShieldCheck,
  UserCheck,
  Zap,
  SlidersHorizontal,
  X,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RiderTelemetry {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "idle" | "in_transit" | "offline";
  zone: string;
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  activeOrderId?: string;
  activeOrderRef?: string;
  slaStatus: "on_time" | "delayed" | "critical";
  rating: number;
}

interface ActiveRoute {
  orderRef: string;
  riderId: string;
  store: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
}

// Map center controller
function MapFlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

export default function AdminDispatchMap() {
  const [telemetry, setTelemetry] = useState<{
    totalRiders: number;
    activeRiders: number;
    inTransitCount: number;
    idleCount: number;
    riders: RiderTelemetry[];
    activeRoutes: ActiveRoute[];
  }>({
    totalRiders: 24,
    activeRiders: 5,
    inTransitCount: 3,
    idleCount: 2,
    riders: [],
    activeRoutes: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_transit" | "idle">("all");
  const [selectedRider, setSelectedRider] = useState<RiderTelemetry | null>(null);
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);

  // Reassignment Modal State
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignTargetRider, setReassignTargetRider] = useState<RiderTelemetry | null>(null);
  const [newSelectedRiderId, setNewSelectedRiderId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState("");
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  const fetchTelemetry = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiClient.get("/admin/dispatch/fleet-telemetry");
      if (res.data?.success && res.data?.telemetry) {
        setTelemetry(res.data.telemetry);
      }
    } catch (err) {
      console.error("Failed to load telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const zones = useMemo(() => {
    const list = new Set(telemetry.riders.map((r) => r.zone));
    return ["all", ...Array.from(list)];
  }, [telemetry.riders]);

  const filteredRiders = useMemo(() => {
    return telemetry.riders.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.activeOrderRef && r.activeOrderRef.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchZone = selectedZone === "all" || r.zone === selectedZone;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchZone && matchStatus;
    });
  }, [telemetry.riders, searchQuery, selectedZone, statusFilter]);

  // Leaflet custom icons
  const createRiderIcon = (rider: RiderTelemetry) => {
    const isTransit = rider.status === "in_transit";
    const isDelayed = rider.slaStatus === "delayed";
    const bgClass = isDelayed ? "bg-amber-600" : isTransit ? "bg-indigo-600" : "bg-emerald-600";
    const pulseRing = isTransit
      ? `<span class="absolute -inset-1 rounded-full ${isDelayed ? "bg-amber-500/40" : "bg-indigo-500/40"} animate-ping"></span>`
      : "";

    return L.divIcon({
      className: "custom-rider-marker",
      html: `
        <div class="relative flex items-center justify-center cursor-pointer">
          ${pulseRing}
          <div class="w-10 h-10 ${bgClass} text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white transform transition hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="absolute -bottom-5 px-1.5 py-0.5 bg-gray-900/90 text-white text-[10px] font-bold rounded shadow whitespace-nowrap">
            ${rider.name.split(" ")[0]}
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const storeIcon = L.divIcon({
    className: "custom-store-marker",
    html: `
      <div class="w-8 h-8 bg-indigo-950 text-indigo-400 rounded-lg flex items-center justify-center shadow-md border border-indigo-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const destIcon = L.divIcon({
    className: "custom-dest-marker",
    html: `
      <div class="w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 30]
  });

  const handleSelectRider = (rider: RiderTelemetry) => {
    setSelectedRider(rider);
    setMapTarget([rider.currentLat, rider.currentLng]);
  };

  const handleOpenReassign = (rider: RiderTelemetry) => {
    setReassignTargetRider(rider);
    const firstIdle = telemetry.riders.find((r) => r.status === "idle" && r.id !== rider.id);
    setNewSelectedRiderId(firstIdle?.id || "");
    setReassignReason(`SLA bottleneck in ${rider.zone}`);
    setIsReassignOpen(true);
  };

  const handleExecuteReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTargetRider || !newSelectedRiderId) return;

    setIsSubmittingReassign(true);
    try {
      const res = await apiClient.post("/admin/dispatch/reassign", {
        orderId: reassignTargetRider.activeOrderId,
        orderRef: reassignTargetRider.activeOrderRef,
        newRiderId: newSelectedRiderId,
        reason: reassignReason
      });

      if (res.data?.success) {
        setReassignSuccessMsg(res.data.message || "Order reassigned successfully!");
        setTimeout(() => {
          setIsReassignOpen(false);
          setReassignSuccessMsg("");
          fetchTelemetry(true);
        }, 1500);
      }
    } catch (err) {
      console.error("Reassign failed:", err);
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Operations Command • Lagos Dispatch Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Live Courier Dispatch Telemetry & Fleet Map
          </h1>
          <p className="text-sm text-text-secondary">
            Real-time GPS telemetry, battery metrics, active delivery polylines & 1-tap manual SLA intervention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTelemetry(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-text-primary rounded-xl font-semibold text-sm hover:bg-secondary/80 border border-border transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-primary" : ""} />
            {refreshing ? "Syncing Fleet..." : "Sync Live Radar"}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Fleet</span>
            <Bike size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-text-primary">{telemetry.totalRiders}</div>
          <p className="text-xs text-text-muted mt-1">Lagos Operational Fleet</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Transit</span>
            <Zap size={18} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {telemetry.inTransitCount}
          </div>
          <p className="text-xs text-text-muted mt-1">Active Deliveries on Road</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Idle Couriers</span>
            <UserCheck size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {telemetry.idleCount}
          </div>
          <p className="text-xs text-text-muted mt-1">Available for Proximity Dispatch</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Adherence</span>
            <Clock size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-text-primary">96.4%</div>
          <p className="text-xs text-emerald-500 font-medium mt-1">Within 35 min target</p>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Fleet Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Panel (8 cols) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[650px] relative">
          {/* Map Top Bar Controls */}
          <div className="p-4 border-b border-border bg-surface/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase">Zone:</span>
              <div className="flex items-center gap-1 overflow-x-auto max-w-sm pb-1">
                {zones.map((zone) => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedZone === zone
                        ? "bg-primary text-white shadow-sm"
                        : "bg-secondary text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {zone === "all" ? "All Lagos" : zone.split("/")[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === "all" ? "bg-primary text-white" : "bg-secondary text-text-secondary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("in_transit")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === "in_transit"
                    ? "bg-indigo-600 text-white"
                    : "bg-secondary text-text-secondary"
                }`}
              >
                In Transit ({telemetry.inTransitCount})
              </button>
              <button
                onClick={() => setStatusFilter("idle")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  statusFilter === "idle"
                    ? "bg-emerald-600 text-white"
                    : "bg-secondary text-text-secondary"
                }`}
              >
                Idle ({telemetry.idleCount})
              </button>
            </div>
          </div>

          {/* Leaflet Map View */}
          <div className="flex-1 w-full relative z-0">
            <MapContainer
              center={[6.5244, 3.3792]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFlyTo coords={mapTarget} />

              {/* Render Active Delivery Polylines & Markers */}
              {telemetry.activeRoutes.map((route) => (
                <React.Fragment key={route.orderRef}>
                  <Marker position={[route.store.lat, route.store.lng]} icon={storeIcon}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <p className="font-bold text-indigo-700">{route.store.name}</p>
                        <p className="text-gray-600">Merchant Pickup Point</p>
                        <p className="text-gray-400 mt-1">Ref: {route.orderRef}</p>
                      </div>
                    </Popup>
                  </Marker>

                  <Marker position={[route.destination.lat, route.destination.lng]} icon={destIcon}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <p className="font-bold text-rose-700">{route.destination.name}</p>
                        <p className="text-gray-600">Customer Dropoff Address</p>
                        <p className="text-gray-400 mt-1">Ref: {route.orderRef}</p>
                      </div>
                    </Popup>
                  </Marker>

                  <Polyline
                    positions={[
                      [route.store.lat, route.store.lng],
                      [route.destination.lat, route.destination.lng]
                    ]}
                    color="#4f46e5"
                    weight={3}
                    dashArray="6, 8"
                    opacity={0.8}
                  />
                </React.Fragment>
              ))}

              {/* Render Courier Markers */}
              {filteredRiders.map((rider) => (
                <Marker
                  key={rider.id}
                  position={[rider.currentLat, rider.currentLng]}
                  icon={createRiderIcon(rider)}
                  eventHandlers={{
                    click: () => handleSelectRider(rider)
                  }}
                >
                  <Popup>
                    <div className="p-2.5 min-w-[200px] text-xs">
                      <div className="flex items-center justify-between border-b pb-1 mb-2">
                        <span className="font-bold text-sm text-gray-900">{rider.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rider.status === "in_transit"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {rider.status.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-1">{rider.vehicle}</p>
                      <p className="text-gray-500 mb-2">Zone: {rider.zone}</p>

                      <div className="flex items-center justify-between text-gray-700 mb-2">
                        <span>Battery: {rider.batteryLevel}%</span>
                        <span className="font-bold">★ {rider.rating}</span>
                      </div>

                      {rider.activeOrderRef && (
                        <div className="bg-indigo-50 border border-indigo-200 p-2 rounded mb-2">
                          <p className="font-semibold text-indigo-900">
                            Active Order: {rider.activeOrderRef}
                          </p>
                          <p className="text-[10px] text-indigo-700">
                            SLA Status:{" "}
                            <span
                              className={
                                rider.slaStatus === "delayed" ? "text-amber-700 font-bold" : "text-emerald-700"
                              }
                            >
                              {rider.slaStatus.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      )}

                      {rider.status === "in_transit" && (
                        <button
                          onClick={() => handleOpenReassign(rider)}
                          className="w-full mt-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 rounded transition text-[11px]"
                        >
                          Reassign Order
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Fleet Roster & Selected Details (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-[650px] bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Header & Search */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Bike size={18} className="text-primary" />
                Active Fleet Roster
              </h2>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                {filteredRiders.length} couriers
              </span>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-text-muted" />
              <input
                type="text"
                placeholder="Search courier, zone, or FLW ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Courier List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredRiders.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">
                No active couriers match your filters.
              </div>
            ) : (
              filteredRiders.map((rider) => {
                const isSelected = selectedRider?.id === rider.id;
                return (
                  <motion.div
                    key={rider.id}
                    onClick={() => handleSelectRider(rider)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-surface hover:border-primary/40 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-text-primary">{rider.name}</span>
                          <span className="text-[11px] font-medium text-amber-500">★ {rider.rating}</span>
                        </div>
                        <p className="text-xs text-text-muted truncate">{rider.vehicle}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rider.status === "in_transit"
                            ? "bg-indigo-500/10 text-indigo-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {rider.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Battery
                          size={13}
                          className={
                            rider.batteryLevel > 70
                              ? "text-emerald-500"
                              : rider.batteryLevel > 30
                              ? "text-amber-500"
                              : "text-rose-500"
                          }
                        />
                        {rider.batteryLevel}%
                      </span>
                      <span className="truncate max-w-[140px] text-text-muted">{rider.zone}</span>
                    </div>

                    {rider.activeOrderRef && (
                      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          <Zap size={13} />
                          {rider.activeOrderRef}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReassign(rider);
                          }}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-[11px] font-bold rounded-lg transition"
                        >
                          Reassign
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 1-Tap Reassign Modal */}
      <AnimatePresence>
        {isReassignOpen && reassignTargetRider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setIsReassignOpen(false)}
                className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-amber-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold text-text-primary">
                  1-Tap Courier Reassignment
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Operations SLA Intervention: Reassign active order to a nearby idle champion to prevent customer breach.
              </p>

              {reassignSuccessMsg ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {reassignSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleExecuteReassign} className="space-y-4">
                  <div className="p-3 bg-secondary/50 rounded-xl border border-border">
                    <p className="text-xs text-text-muted">Currently Assigned To</p>
                    <p className="text-sm font-bold text-text-primary">
                      {reassignTargetRider.name} ({reassignTargetRider.vehicle})
                    </p>
                    <p className="text-xs text-indigo-500 font-semibold mt-1">
                      Active Order: {reassignTargetRider.activeOrderRef} • Zone: {reassignTargetRider.zone}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Select Replacement Idle Courier:
                    </label>
                    <select
                      value={newSelectedRiderId}
                      onChange={(e) => setNewSelectedRiderId(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Available Courier --</option>
                      {telemetry.riders
                        .filter((r) => r.id !== reassignTargetRider.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.zone} • Batt: {r.batteryLevel}% • {r.status.toUpperCase()})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Reason for Reassignment:
                    </label>
                    <input
                      type="text"
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      placeholder="e.g. Courier puncture, battery dead, SLA breach alert"
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsReassignOpen(false)}
                      className="px-4 py-2 bg-secondary text-text-secondary rounded-xl text-xs font-semibold hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReassign}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                    >
                      {isSubmittingReassign ? "Reassigning..." : "Confirm SLA Reassignment"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copyright Footer */}
      <div className="text-center text-xs text-text-muted py-2">
        © 2026 FlowMart Technologies. Operations Telemetry Radar V2.
      </div>
    </div>
  );
}
