import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useOrders } from '@/hooks/useRiderQueries';
import {
  Loader2, Bell, QrCode, AlertCircle, TrendingUp,
  Clock, ChevronRight, Crosshair, Package
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const [isOnline, setIsOnline] = useState(true);

  // Format the current date as "Tuesday, 17 Jun 2025"
  const currentDate = format(new Date(), 'EEEE, d MMM yyyy');

  // Derive initial values from user/avatar
  const firstName = user?.fullName?.split(' ')[0] || '';
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '';

  // Fallbacks for stats if the API hasn't resolved or returns differently
  const revenue = stats?.revenueToday || 'N0.00';
  const deliveryCount = stats?.newOrders || 0; // mapping newOrders to delivery count

  // Filter pending and in-transit orders
  const assignedOrders = orders?.filter(o => o.status === 'pending' || o.status === 'picked_up' || o.status === 'assigned') || [];
  const inTransitOrder = assignedOrders.find(o => o.status === 'picked_up' || o.status === 'assigned'); // Active delivery

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* Mobile Header */}
      <div className="md:hidden px-5 pt-6 pb-4 flex items-start justify-between bg-white sticky top-0 z-40 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Good Morning, {firstName} <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#047857] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="relative">
            <Bell size={20} className="text-slate-600" />
            <div className="absolute 0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-5 md:grid md:grid-cols-12 md:items-start md:gap-6 md:p-8">
        
        {/* Left Column for desktop */}
        <div className="flex flex-col gap-5 md:col-span-7 lg:col-span-8">
          {/* Earnings Card */}
          <div className="bg-[#15803d] rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isOnline ? 'bg-white/20 text-white' : 'bg-slate-500/40 text-slate-200'
                }`}
            >
              <Crosshair size={12} />
              {isOnline ? 'Online' : 'Offline'}
            </button>
            <div className="text-right">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white opacity-80 ml-auto" />
              ) : (
                <>
                  <h2 className="text-2xl font-black">{revenue}</h2>
                  <p className="text-[11px] font-medium text-emerald-100 opacity-90 mt-0.5 text-right">
                    {deliveryCount} deliveries
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-50 max-w-[120px] leading-snug">
              {isOnline ? 'Ready for deliveries' : 'You are currently offline'}
            </p>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-600 rounded-full opacity-40 blur-2xl"></div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <QuickAction icon={<QrCode size={20} className="text-[#15803d]" />} label="Scan QR" />
          <QuickAction icon={<AlertCircle size={20} className="text-red-500" />} label="Report" />
          <QuickAction icon={<TrendingUp size={20} className="text-[#15803d]" />} label="My Earnings" />
          <QuickAction icon={<Clock size={20} className="text-slate-500" />} label="History" />
        </div>
        </div>

        {/* Right Column for desktop */}
        <div className="flex flex-col gap-5 md:col-span-5 lg:col-span-4 mt-2 md:mt-0">
          {/* Assigned Deliveries Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Assigned Deliveries</h3>
            <div className="bg-[#dcfce7] text-[#166534] px-2.5 py-1 rounded-md text-[10px] font-bold">
              {assignedOrders.length} pending
            </div>
          </div>

          {/* Deliveries List */}
          <div className="flex flex-col gap-3">
            {ordersLoading ? (
              <div className="flex justify-center p-6 bg-white rounded-2xl">
                <Loader2 className="animate-spin text-[#15803d]" />
              </div>
            ) : assignedOrders.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl text-center text-sm text-slate-500 shadow-xs border border-slate-100">
                No assigned deliveries at the moment.
              </div>
            ) : (
              assignedOrders.map((order, i) => (
                <div key={order.id || i} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 cursor-pointer hover:border-emerald-200 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center shrink-0">
                      <Package size={20} className="text-[#15803d]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          {order.vendorId /* Real API uses vendorId or attendee ID for name, falling back to ID if name missing */}
                        </h4>
                        <span className="bg-[#dcfce7] text-[#166534] text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          {order.deliveryZone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">×{order.items?.length || 1} packs</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${order.status === 'picked_up' || order.status === 'assigned'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                          {order.status === 'picked_up' || order.status === 'assigned' ? 'In Transit' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Currently Delivering Sticky Card */}
      {inTransitOrder && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-white/90 pb-8 z-50">
          <div className="bg-white rounded-[20px] p-5 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100">
            <p className="text-[10px] font-bold text-[#15803d] tracking-wider uppercase mb-2">
              Currently Delivering
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 truncate">{inTransitOrder.customerName || inTransitOrder.vendorId || 'Unknown'}</h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Zone: {inTransitOrder.deliveryZone}
                </p>
              </div>
              <button className="bg-[#15803d] hover:bg-[#166534] text-white px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm">
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="bg-white rounded-[18px] p-3 flex flex-col items-center justify-center gap-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-slate-200 transition-colors active:scale-95">
      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-600 tracking-tight">{label}</span>
    </button>
  );
}