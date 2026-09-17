import React from 'react';
import { useDashboardStats } from '@/hooks/useRiderQueries';
import { MoreHorizontal } from 'lucide-react';
import { RiderButton } from '@/components/ui/button';

export default function Earnings() {
  const { data: stats } = useDashboardStats();
  
  const totalEarnings = stats?.revenueToday || 'N0.00';
  const payouts = stats?.payouts || [];

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] font-body min-h-screen relative">
      <div className="md:hidden px-5 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-[#f8fafc] z-10">
        <div>
          <h1 className="text-xl font-headings font-extrabold text-slate-800">My Earnings</h1>
          <p className="text-[11px] text-slate-400 font-medium">Weekly summary and payout history</p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <MoreHorizontal size={18} className="text-slate-600" />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5 md:grid md:grid-cols-12 md:items-start md:gap-6 md:p-8">
        
        {/* Left Column for desktop */}
        <div className="flex flex-col gap-5 md:col-span-7 lg:col-span-8">
          {/* Total Earnings Card */}
          <div className="bg-[#15803d] rounded-3xl p-5 text-white shadow-md">
          <p className="text-xs text-emerald-100/90 font-medium tracking-wide">Total Earnings (This Week)</p>
          <h2 className="text-3xl font-black mt-1 mb-6">{totalEarnings}</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-[10px] text-emerald-100 font-medium">Deliveries</p>
              <p className="text-base font-bold mt-0.5">{stats?.deliveriesCount || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <p className="text-[10px] text-emerald-100 font-medium">Pending Tips</p>
              <p className="text-base font-bold mt-0.5">{stats?.pendingTips || 'N0.00'}</p>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800">Earnings Breakdown</h3>
            <p className="text-[10px] text-slate-400">Daily earnings for the current week</p>
          </div>
          
          {/* Real Bar Chart */}
          <div className="flex items-end justify-between h-32 gap-2 mt-2 border-b border-slate-100 pb-2 relative">
            {stats?.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
              stats.weeklyRevenue.map((dayData, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                  <div 
                    className={`w-full rounded-t-sm ${i === stats.weeklyRevenue.length - 2 ? 'bg-emerald-500' : i === stats.weeklyRevenue.length - 1 ? 'bg-slate-100' : 'bg-[#15803d]'}`} 
                    style={{ height: `${dayData.h}%` }}
                  ></div>
                  <span className={`text-[10px] font-bold ${i === stats.weeklyRevenue.length - 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayData.day}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs text-slate-400">No chart data available</span>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* Right Column for desktop */}
        <div className="pb-[90px] md:pb-0 md:col-span-5 lg:col-span-4 flex flex-col gap-5">
          {/* Recent Payouts */}
          <div className="bg-white md:p-5 md:rounded-3xl md:border md:border-slate-100 md:shadow-sm">
            <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-800">Recent Payouts</h3>
            <p className="text-[10px] text-slate-400">Funds transferred to your bank</p>
          </div>

          <div className="flex flex-col gap-3">
            {payouts.length > 0 ? (
              payouts.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{p.date}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.type}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-[#15803d] mb-1">{p.amount}</h4>
                    <span className="bg-[#dcfce7] text-[#166534] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-center">
                <p className="text-xs text-slate-500 font-medium">No payouts yet.</p>
              </div>
            )}
          </div>
        </div>

          <div className="mt-4">
            <RiderButton className="w-full bg-[#15803d] hover:bg-[#166534] text-white py-6 rounded-[16px] text-sm font-bold shadow-lg">
              Request Payout
            </RiderButton>
          </div>
        </div>
      </div>
    </div>
  );
}
