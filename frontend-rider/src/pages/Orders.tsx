import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, SlidersHorizontal, ChevronRight, Home, Package, DollarSign, User } from 'lucide-react';

// Type safety definitions for Order status tracking
type OrderStatus = 'Pending' | 'In Transit';
type FilterTab = 'All' | 'Pending' | 'In Transit';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  zone: string;
  time: string;
  packagesCount: number;
  status: OrderStatus;
}

export default function Deliveries() {
  const navigate = useNavigate();
  
  // State tracking for the active status sub-tab filter
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  // Hardcoded mockup array capturing every single element from your screen details
  const orders: OrderItem[] = [
    {
      id: '1',
      orderNumber: 'FLW-20250621-0049',
      customerName: 'Chidi Nwosu',
      zone: 'Zone 4 · Lekki',
      time: '09:30 AM',
      packagesCount: 3,
      status: 'In Transit',
    },
    {
      id: '2',
      orderNumber: 'FLW-20250621-0050',
      customerName: 'Funke Balogun',
      zone: 'Zone 8 · Victoria Island',
      time: '10:05 AM',
      packagesCount: 1,
      status: 'In Transit',
    },
    {
      id: '3',
      orderNumber: 'FLW-20250621-0051',
      customerName: 'Adaeze Okonkwo',
      zone: 'Zone C · Ikeja',
      time: '10:42 AM',
      packagesCount: 4,
      status: 'In Transit',
    },
    {
      id: '4',
      orderNumber: 'FLW-20250621-0052',
      customerName: 'Tunde Adeyemi',
      zone: 'Zone C · Ajah',
      time: '11:00 AM',
      packagesCount: 2,
      status: 'Pending',
    },
    {
      id: '5',
      orderNumber: 'FLW-20250621-0053',
      customerName: 'Ngozi Eze',
      zone: 'Zone B · Victoria Island',
      time: '11:15 AM',
      packagesCount: 6,
      status: 'Pending',
    },
  ];

  // Dynamic filter operation computing values on state transitions
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'All') return true;
    return order.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8">
      {/* Mobile Display Container Frame */}
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar">
        
        <div>
          {/* Top Sticky Nav Header Layout */}
          <div className="flex items-center justify-between px-5 pt-6 pb-2 bg-surface">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-foreground hover:opacity-80 transition cursor-pointer bg-transparent border-none"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg text-foreground tracking-tight">Orders</h1>
            <button
              type="button"
              className="text-foreground hover:opacity-80 transition cursor-pointer bg-transparent border-none"
              aria-label="Filter configuration options"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Sub-navigation Tabs Strip Container */}
          <div className="flex border-b border-border/40 bg-surface px-4 gap-6 text-sm font-semibold">
            {(['All', 'Pending', 'In Transit'] as FilterTab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 relative cursor-pointer font-body transition-colors ${
                    isActive ? 'text-[#006837]' : 'text-muted-foreground/70 hover:text-foreground'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#006837] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Order Records Feed */}
          <div className="p-4 flex flex-col gap-3.5">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => console.log(`Navigating to order detail: ${order.orderNumber}`)}
                className="bg-surface rounded-2xl border border-border/70 p-4 flex flex-col gap-2.5 shadow-2xs cursor-pointer hover:border-border transition"
              >
                {/* ID Header Row Segment */}
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-[#006837] font-body tracking-wide">
                    {order.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
                    +{order.packagesCount} {order.packagesCount > 1 ? 'Packs' : 'Pack'}
                  </span>
                </div>

                {/* Main Client Informative Center Line */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
                      {order.customerName}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium font-body">
                      {order.zone}
                    </p>
                  </div>
                  
                  {/* Status Indicator Pill badges */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-body ${
                      order.status === 'In Transit'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Bottom Timeline Row Segment */}
                <div className="flex justify-between items-center border-t border-border/30 pt-2 mt-0.5">
                  <span className="text-xs text-muted-foreground/80 font-medium font-body">
                    {order.time}
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground/50" />
                </div>
              </div>
            ))}

            {/* Fallback layout wrapper for empty database queries */}
            {filteredOrders.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-12 font-body">
                No orders active inside this section right now.
              </p>
            )}
          </div>
        </div>

        {/* Device Bottom Shell Application Navigation Strip */}
        <nav className="border-t border-border/70 flex justify-around py-2.5 bg-surface mt-auto">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground"
          >
            <Home size={18} />
            <span>Home</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#006837] flex-1 bg-transparent border-none cursor-pointer"
          >
            <Package size={18} />
            <span>Deliveries</span>
          </button>
          <button
            type="button"
            onClick={() => console.log('Link to earnings overview')}
            className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground"
          >
            <DollarSign size={18} />
            <span>Earnings</span>
          </button>
          <button
            type="button"
            onClick={() => console.log('Link to profile management')}
            className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground"
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}