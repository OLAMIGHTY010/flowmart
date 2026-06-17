import { X, Navigation, Phone, Activity } from 'lucide-react';
import type { RiderItem } from '@/services/RiderServices';

interface RiderDetailsSidebarProps {
  rider: RiderItem;
  onClose: () => void;
}

export default function RiderDetailsSidebar({ rider, onClose }: RiderDetailsSidebarProps) {
  // Mock data for the 7-day bar chart
  const weeklyDeliveries = [12, 15, 8, 22, 19, 25, 20];
  const maxDeliveries = Math.max(...weeklyDeliveries);

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[350px] bg-[#f8fafc] shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300">
      
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 flex flex-col gap-6">
        
        {/* Header / Profile */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm relative">
              {rider.fullName.charAt(0)}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors bg-white border border-slate-200 shadow-sm">
            <X size={16} />
          </button>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</div>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Phone size={14} className="text-slate-400" />
              {rider.phone}
            </div>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-success border border-green-100">
            <Navigation size={20} />
          </div>
        </div>

        {/* Live Location Tracker */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Location Tracker</h4>
            <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div> Active
            </span>
          </div>
          
          {/* Mock Map View */}
          <div className="h-40 bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 to-transparent"></div>
            
            {/* Pulsing Dot */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 bg-success/20 rounded-full animate-ping absolute"></div>
              <div className="w-4 h-4 bg-success rounded-full border-2 border-white shadow-md relative z-20"></div>
              <div className="mt-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg relative z-20 whitespace-nowrap">
                {rider.currentLocation}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Activity size={12} className="text-success" />
            Last ping: just now
          </div>
        </div>

        {/* 7-day Deliveries Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">7-Day Deliveries</h4>
            <div className="p-1 bg-green-50 rounded text-success">
              <Activity size={14} />
            </div>
          </div>
          
          <div className="flex items-end justify-between h-32 gap-2 mt-2">
            {weeklyDeliveries.map((val, i) => {
              const heightPct = (val / maxDeliveries) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2">
                  <div className="w-full bg-slate-100 rounded-t-sm rounded-b-sm flex items-end h-full">
                    <div 
                      className="w-full bg-success rounded-t-sm rounded-b-sm transition-all duration-500 hover:bg-green-500 relative group"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-3 text-center uppercase tracking-wider">
            Past Week
          </div>
        </div>

      </div>
    </div>
  );
}
