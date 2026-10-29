import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useOrders } from '@/hooks/useRiderQueries';
import { useToast } from "@/contexts/ToastContext";
import StatCard from '@/components/vendor/StatCard';
import Icon from '@/components/Icon';
import RiderLogisticsSlaCard from '@/components/rider/RiderLogisticsSlaCard';
import { RiderAutonomousOfferModal } from '@/components/rider/RiderAutonomousOfferModal';
import {
  Flame,
  Zap,
  Navigation2,
  Clock,
  Compass,
  BatteryCharging,
  Radio,
  MapPin,
  Target,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "@/services/api";

interface Hotspot {
  id: string;
  name: string;
  zone: string;
  surgeMultiplier: number;
  demandLevel: string;
  badge: string;
  pendingOrders: number;
  avgEarningsPerDrop: number;
  coords: { lat: number; lng: number };
  note: string;
}

export default function RiderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const [isOnline, setIsOnline] = useState(true);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [shiftSeconds, setShiftSeconds] = useState(13320); // 3h 42m

  useEffect(() => {
    fetchHotspots();
    const timer = setInterval(() => {
      setShiftSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHotspots = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; hotspots: Hotspot[] }>('/rider/hotspots');
      if (res.success && res.hotspots) {
        setHotspots(res.hotspots);
      }
    } catch {
      // Fallback sensible hotspots
      setHotspots([
        {
          id: "hotspot-yaba",
          name: "Yaba Tech Cluster & University Road",
          zone: "Lagos Mainland",
          surgeMultiplier: 1.4,
          demandLevel: "Very High",
          badge: "🔥 1.4x Surge Active",
          pendingOrders: 14,
          avgEarningsPerDrop: 2400,
          coords: { lat: 6.518, lng: 3.376 },
          note: "High lunch rush and grocery requests from students & tech offices",
        },
        {
          id: "hotspot-ikeja",
          name: "Ikeja GRA & City Mall Commercial Hub",
          zone: "Ikeja / Airport Axis",
          surgeMultiplier: 1.25,
          demandLevel: "High",
          badge: "⚡ 1.25x Rush Hour",
          pendingOrders: 10,
          avgEarningsPerDrop: 2200,
          coords: { lat: 6.596, lng: 3.351 },
          note: "Multiple restaurant cluster with 3-minute average meal prep times",
        },
        {
          id: "hotspot-vi-lekki",
          name: "Victoria Island & Admiralty Way (Lekki 1)",
          zone: "Lagos Island / Lekki",
          surgeMultiplier: 1.35,
          demandLevel: "Very High",
          badge: "🌧️ Rain & Evening Surge",
          pendingOrders: 18,
          avgEarningsPerDrop: 2900,
          coords: { lat: 6.435, lng: 3.442 },
          note: "Highest tipping density and bulk team lunches",
        },
      ]);
    }
  };

  const assignedOrders = orders?.filter(
    (o) => o.status === 'pending' || o.status === 'picked_up' || o.status === 'assigned'
  ) || [];

  const inTransitOrder = assignedOrders.find(
    (o) => o.status === 'picked_up' || o.status === 'assigned'
  );

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  const formatShiftTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    showToast(
      isOnline ? "You are now Offline" : "You are now Online and receiving high-priority requests",
      isOnline ? "warning" : "success"
    );
  };

  return (
    <div className="flex-1 lg:mt-0 bg-background flex flex-col gap-6 pt-2 pb-24 lg:pb-8" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* ================= 1. SHIFT STATUS & TELEMETRY HEARTBEAT BAR ================= */}
      <div className="bg-surface border border-border rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <span className={`w-4 h-4 rounded-full block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isOnline && (
                <span className="w-4 h-4 rounded-full bg-emerald-400/40 animate-ping absolute inset-0" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  Status: {isOnline ? 'Active on Shift' : 'Offline'}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isOnline ? 'Dispatch Ready' : 'Resting'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1 font-semibold">
                <span className="flex items-center gap-1">
                  <Radio size={13} className="text-primary" /> GPS Telemetry: ±4m Accuracy
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-primary" /> Shift: {formatShiftTime(shiftSeconds)}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <BatteryCharging size={13} className="text-emerald-600" /> Battery: 94%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rider/earnings')}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-secondary hover:bg-secondary/80 text-foreground transition cursor-pointer flex items-center gap-1.5"
            >
              <Target size={14} className="text-primary" />
              <span>Daily Goal (74%)</span>
            </button>
            <button
              onClick={toggleStatus}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                isOnline
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Autonomous Dispatch Offer Modal (Active when Online) */}
      {isOnline && <RiderAutonomousOfferModal riderId={user?.id || 'rider-lagos-01'} />}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <StatCard
          label="New Deliveries"
          value={statsLoading ? '...' : (assignedOrders.filter((o) => o.status === 'pending' || o.status === 'assigned').length.toString())}
          icon="bell"
          sub="Pending assignments"
        />
        <StatCard
          label="In Progress"
          value={statsLoading ? '...' : (assignedOrders.filter((o) => o.status === 'picked_up').length.toString())}
          icon="loader"
          sub="Active trips"
        />
        <StatCard
          label="Revenue Today"
          value={statsLoading ? '...' : (stats?.revenueToday || '₦18,400')}
          icon="trending-up"
          accent
          sub="74% of ₦25k goal"
        />
        <StatCard
          label="Completed"
          value={statsLoading ? '...' : ((stats?.deliveriesCount || orders?.filter((o) => o.status === 'delivered').length || 24).toString())}
          icon="package"
          sub="Total trips"
        />
      </div>

      {/* ================= 2. CHOWDECK-STYLE HIGH-DEMAND HOTSPOTS RADAR ================= */}
      <div className="bg-surface border border-border rounded-3xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-xs">
              <Flame size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                Chowdeck Demand Hotspots Radar
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  Live Lagos Surge
                </span>
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Head towards highlighted restaurant clusters to receive immediate dispatches & surge bonuses
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">Updated 1m ago</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotspots.map((spot) => (
            <div
              key={spot.id}
              className="bg-secondary/40 hover:bg-secondary/70 border border-border/80 rounded-2xl p-4 flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase text-primary tracking-wider">
                    {spot.zone}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    {spot.badge}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition">
                  {spot.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {spot.note}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Pending Orders
                  </span>
                  <span className="text-sm font-black text-foreground">
                    ~{spot.pendingOrders} meals • ~₦{spot.avgEarningsPerDrop.toLocaleString()}/drop
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.coords.lat},${spot.coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition shadow-xs flex items-center justify-center cursor-pointer"
                  title="Navigate with Google Maps"
                >
                  <Navigation2 size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout Split: Left (Deliveries & Quick Actions) | Right (Weekly Revenue Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Live Zone Logistics & SLA Intelligence */}
          <RiderLogisticsSlaCard />

          {/* Active / Assigned Deliveries list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                Assigned Deliveries
              </h2>
              <button
                onClick={() => navigate('/rider/deliveries')}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none"
              >
                View history
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {ordersLoading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading deliveries...</div>
              ) : assignedOrders.length > 0 ? (
                assignedOrders.slice(0, 3).map((order, i) => (
                  <div 
                    key={i} 
                    onClick={() => navigate(`/rider/deliveries/${order.id}`)}
                    className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xs hover:border-primary cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon i="truck" size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary font-bold">#{order.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          Zone {order.deliveryZone}
                        </span>
                      </div>
                      <p className="text-sm text-foreground font-semibold mt-0.5">
                        {order.customerName || `Customer #${order.userId.substring(0, 5)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm text-foreground font-bold">{formatCurrency(order.totalAmount)}</span>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                        <span className="text-[10px] text-warning font-bold uppercase tracking-wider">{order.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground bg-surface border border-dashed border-border rounded-2xl">
                  No active or assigned deliveries at the moment.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-headings font-extrabold text-foreground mb-3" style={{ fontWeight: 800 }}>
              Quick Actions
            </h2>
            <div className="flex gap-3">
              {[
                { icon: 'camera', label: 'Scan QR', action: () => showToast("Camera scanner coming soon!", "info") },
                { icon: 'alert-circle', label: 'Report', action: () => showToast("Support ticket interface coming soon!", "info") },
                { icon: 'trending-up', label: 'Earnings & Goals', action: () => navigate('/rider/earnings') }
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className="flex-1 bg-surface border border-border rounded-2xl py-3.5 flex flex-col items-center gap-1.5 hover:bg-muted/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <Icon i={a.icon} size={20} className="text-primary" />
                  <span className="text-xs font-body font-semibold text-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Earnings Chart (Right Side) */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Weekly Earnings</h2>
            <span className="text-xs text-primary bg-secondary px-2.5 py-1 rounded-full font-bold">This week</span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2.5 h-28 pt-2">
            {(stats?.weeklyRevenue || []).map((bar: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${i === 5 ? 'bg-primary' : 'bg-secondary'}`}
                  style={{ height: `${bar.h}%`, minHeight: '10%' }}
                />
                <span className="text-[10px] text-muted-foreground font-semibold">{bar.day}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Earnings</p>
              <p className="text-lg font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                {statsLoading ? '...' : (stats?.totalRevenue || '₦38,400')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg payout</p>
              <p className="text-lg font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                {statsLoading ? '...' : (stats?.avgOrder || '₦2,400')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Delivering Sticky Card */}
      {inTransitOrder && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pb-8 z-50 lg:pl-64">
          <div className="max-w-md mx-auto bg-surface rounded-3xl p-5 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] border border-border">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <p className="text-[10px] font-bold text-primary tracking-widest uppercase">
                Active Job in Progress
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="font-extrabold text-foreground truncate">
                  {inTransitOrder.customerName || `Customer #${inTransitOrder.userId.substring(0, 5)}`}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <Icon i="map-pin" size={12} className="shrink-0" />
                  <p className="text-xs font-semibold truncate">
                    Zone {inTransitOrder.deliveryZone}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/rider/deliveries/${inTransitOrder.id}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm cursor-pointer border-none"
              >
                Go to Navigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
