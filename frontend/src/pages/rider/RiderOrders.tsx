import React, { useState } from 'react';
import { useOrders } from '@/hooks/useRiderQueries';
import { Filter, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');

  const filteredOrders = orders.filter((o: any) => {
    if (activeTab === 'Active') return ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status);
    if (activeTab === 'Completed') return o.status === 'delivered';
    if (activeTab === 'Cancelled') return o.status === 'cancelled';
    return true;
  });

  const activeCount = orders.filter(o => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] font-body min-h-screen relative">
      <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <div className="flex items-center justify-between mb-4 md:hidden">
          <div>
            <h1 className="text-xl font-headings font-extrabold text-slate-800 tracking-tight">My Deliveries</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Track your past and current assignments</p>
          </div>
          <button className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        <div className="flex gap-2 text-xs font-bold">
          <TabButton title="Active" count={activeCount} isActive={activeTab === 'Active'} onClick={() => setActiveTab('Active')} />
          <TabButton title="Completed" count={completedCount} isActive={activeTab === 'Completed'} onClick={() => setActiveTab('Completed')} />
          <TabButton title="Cancelled" count={cancelledCount} isActive={activeTab === 'Cancelled'} onClick={() => setActiveTab('Cancelled')} />
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto pb-24 md:grid md:grid-cols-2 lg:grid-cols-3 md:content-start md:p-8">
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-[#15803d]" />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order: any, i: number) => (
            <div 
              key={order.id || i}
              onClick={() => navigate(`/rider/deliveries/${order.id}`)}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3 cursor-pointer hover:border-emerald-200 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-[#dcfce7] flex items-center justify-center shrink-0 mt-1">
                <Package size={20} className="text-[#15803d]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{order.id?.toUpperCase() || `Order #${i + 1}`}</h3>
                    <p className="text-[10px] text-blue-600 font-bold tracking-wide uppercase mt-0.5">
                      {order.status === 'in_transit' || order.status === 'picked_up' ? 'In Transit' : order.status}
                    </p>
                  </div>
                  {i === 0 && activeTab === 'Active' && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 uppercase">
                      Priority
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-50 pt-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5"></div>
                    <p className="text-xs text-slate-600 leading-tight">
                      Package from <span className="font-bold">FlowMart HQ</span> - {order.deliveryZone || 'Unknown Zone'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5"></div>
                    <p className="text-xs text-slate-600 leading-tight">
                      Deliver to <span className="font-bold">{order.customerName || order.vendorId || 'Customer Location'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500">No {activeTab.toLowerCase()} deliveries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ title, count, isActive, onClick }: { title: string, count: number, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
        isActive ? 'bg-[#15803d] text-white' : 'bg-transparent text-slate-500 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      <span>{title}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
      }`}>
        {count}
      </span>
    </button>
  );
}