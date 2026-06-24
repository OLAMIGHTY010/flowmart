import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useOrders } from '@/hooks/useRiderQueries';
import { useToast } from "@/contexts/ToastContext";
import StatCard from '@/components/vendor/StatCard';
import Icon from '@/components/Icon';

export default function RiderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const [isOnline, setIsOnline] = useState(true);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Rider';

  const assignedOrders = orders?.filter(
    o => o.status === 'pending' || o.status === 'picked_up' || o.status === 'assigned'
  ) || [];

  const inTransitOrder = assignedOrders.find(
    o => o.status === 'picked_up' || o.status === 'assigned'
  );

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    showToast(
      isOnline ? "You are now Offline" : "You are now Online and receiving requests",
      isOnline ? "warning" : "success"
    );
  };

  return (
    <div className="flex-1 lg:mt-0 bg-background flex flex-col gap-6 pt-2 pb-24 lg:pb-8">
      {/* Online / Offline Status Toggle Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Rider Status: {isOnline ? 'Online' : 'Offline'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'You are visible to dispatch and receiving assignments.' : 'Go online to receive new jobs.'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isOnline ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-none' : 'bg-secondary hover:bg-secondary/80 text-foreground border-none'
          }`}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <StatCard
          label="New Deliveries"
          value={statsLoading ? '...' : (assignedOrders.filter(o => o.status === 'pending' || o.status === 'assigned').length.toString())}
          icon="bell"
          sub="Pending jobs"
        />
        <StatCard
          label="In Progress"
          value={statsLoading ? '...' : (assignedOrders.filter(o => o.status === 'picked_up').length.toString())}
          icon="loader"
          sub="Active delivery"
        />
        <StatCard
          label="Revenue Today"
          value={statsLoading ? '...' : (stats?.revenueToday || '₦0')}
          icon="trending-up"
          accent
          sub="Today's payouts"
        />
        <StatCard
          label="Completed"
          value={statsLoading ? '...' : ((stats?.deliveriesCount || orders?.filter(o => o.status === 'delivered').length || 0).toString())}
          icon="package"
          sub="Total trips"
        />
      </div>

      {/* Layout Split: Left (Deliveries & Quick Actions) | Right (Weekly Revenue Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
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
                        {order.customerName || `Customer #${order.attendeeId.substring(0, 5)}`}
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
                { icon: 'trending-up', label: 'Earnings', action: () => navigate('/rider/earnings') }
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
                {statsLoading ? '...' : (stats?.totalRevenue || '₦0')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg payout</p>
              <p className="text-lg font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                {statsLoading ? '...' : (stats?.avgOrder || '₦0')}
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
                  {inTransitOrder.customerName || `Customer #${inTransitOrder.attendeeId.substring(0, 5)}`}
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