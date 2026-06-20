import { useState } from 'react';
import { 
  RefreshCw, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Clock, 
  Map as MapIcon, 
  Activity,
  Users,
  AlertCircle
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CoordinatorAnalyticsServices } from '../services/CoordinatorAnalyticsServices';

export default function LiveTracker() {
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const queryClient = useQueryClient();

  const { data: overview } = useQuery({
    queryKey: ['coordOverview'],
    queryFn: CoordinatorAnalyticsServices.getOverview
  });

  const { data: zoneGrid } = useQuery({
    queryKey: ['coordLiveZoneGrid'],
    queryFn: CoordinatorAnalyticsServices.getLiveZoneGrid
  });

  const { data: deliveryTrends } = useQuery({
    queryKey: ['coordDeliveryTrends'],
    queryFn: CoordinatorAnalyticsServices.getDeliveryTrends
  });

  const { data: activityFeed } = useQuery({
    queryKey: ['coordLiveActivityFeed'],
    queryFn: CoordinatorAnalyticsServices.getLiveActivityFeed
  });

  const { data: shortageAlerts } = useQuery({
    queryKey: ['coordShortageAlerts'],
    queryFn: CoordinatorAnalyticsServices.getShortageAlerts
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Done': return 'bg-green-100 text-[#16a34a] border-green-200';
      case 'Active': return 'bg-orange-100 text-orange-500 border-orange-200';
      case 'Critical': return 'bg-red-100 text-red-500 border-red-200';
      case 'Pending': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'Done': return 'bg-[#16a34a]';
      case 'Active': return 'bg-orange-500';
      case 'Critical': return 'bg-red-500';
      case 'Pending': return 'bg-slate-300';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="flex flex-col max-w-[1400px] mx-auto min-h-full pb-10 font-body">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <MapIcon size={18} className="text-[#16a34a]" />
          <h1 className="text-lg font-black text-slate-800 font-headings">Live Tracker</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Clock size={14} /> Last updated: {lastUpdated}
          </span>
          <button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['coordLiveZoneGrid'] });
              queryClient.invalidateQueries({ queryKey: ['coordLiveActivityFeed'] });
              queryClient.invalidateQueries({ queryKey: ['coordShortageAlerts'] });
              queryClient.invalidateQueries({ queryKey: ['coordOverview'] });
              setLastUpdated('Just now');
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 shadow-sm">
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="bg-green-50 rounded-xl border border-green-100 p-5 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-green-100 text-[#16a34a] rounded text-[10px] font-black uppercase tracking-widest shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span> LIVE
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">December Welfare Distribution 2024</h2>
            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1"><Clock size={12} /> Started {overview?.avgCompletionTime || '0h 0m'} ago</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1"><Users size={12} /> {overview?.activeRiders ? overview.activeRiders.toLocaleString() : '0'} Riders Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-green-100 text-[#16a34a] font-bold text-xs rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span> Distribution Active
          </div>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors">
            <AlertTriangle size={14} /> Report Shortage
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Zones Completed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500">Zones Completed</span>
            <div className="p-1.5 bg-green-50 text-[#16a34a] rounded-full border border-green-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1 mb-2">
              <h3 className="text-3xl font-black text-[#16a34a]">{overview?.deliveredZones || 0}</h3>
              <span className="text-sm font-bold text-slate-400">/ {overview?.totalZones || 0}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#16a34a] h-full rounded-full" style={{ width: `${overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 100) : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Units Delivered */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500">Units Delivered</span>
            <div className="p-1.5 bg-green-50 text-[#16a34a] rounded-full border border-green-100">
              <Package size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#16a34a] mb-1">{overview?.totalQrDistributed ? overview.totalQrDistributed.toLocaleString() : '0'}</h3>
            <p className="text-[11px] font-medium text-slate-500">Target: 2,500,000 units</p>
          </div>
        </div>

        {/* Shortage Alerts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500">Shortage Alerts</span>
            <div className="p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100">
              <AlertCircle size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-red-600 mb-1">{overview?.criticalAlerts || 0}</h3>
            <p className="text-[11px] font-bold text-red-500">Requires immediate attention</p>
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Zone Map & Timeline) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Zone Status Map Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MapIcon size={16} className="text-[#16a34a]" />
                <h3 className="text-sm font-bold text-slate-800">Zone Status Map Grid</h3>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                <span>{overview?.totalZones || 0} Zones</span>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>Completed</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span>In Progress</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Critical</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Not Started</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {zoneGrid?.map((z: any, i: number) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 flex flex-col hover:shadow-md transition-shadow bg-white relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusDot(z.status)}`}></div>
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <h4 className="text-xs font-black text-slate-800">{z.name}</h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(z.status)}`}>
                      {z.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mb-4 pl-2 truncate">{z.sub}</p>
                  
                  <div className="mt-auto pl-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 mb-1">
                      <Users size={10} className="text-slate-400" /> {z.riders} Riders Active
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                          <div 
                            className={`h-full rounded-full ${z.status === 'Critical' ? 'bg-red-500' : 'bg-[#16a34a]'}`} 
                            style={{ width: `${(z.delivered / z.target) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className={z.status === 'Critical' ? 'text-red-500' : 'text-slate-500'}>{z.delivered.toLocaleString()}</span>
                          <span className="text-slate-400">/ {z.target.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Progress Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#16a34a]" />
                <h3 className="text-sm font-bold text-slate-800">Delivery Progress Timeline</h3>
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                {overview?.avgCompletionTime || '0h 0m'} elapsed
              </div>
            </div>

            <div className="relative pt-6 pb-2 px-2">
              <div className="absolute top-8 left-2 right-2 h-2 bg-slate-100 rounded-full">
                <div className="h-full bg-[#16a34a] rounded-full relative" style={{ width: `${overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 100) : 0}%` }}>
                  <div className="absolute -right-2 -top-1 w-4 h-4 rounded-full border-4 border-white bg-[#16a34a] shadow-sm"></div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-bold text-slate-400 relative z-10 mt-6">
                {deliveryTrends?.slice(0, 6).map((trend: any, index: number) => {
                  const isPast = index <= (overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 6) : 0);
                  const isCurrent = index === (overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 6) : 0);
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <span className={isPast ? "text-[#16a34a]" : isCurrent ? "text-slate-600" : ""}>
                        {index === 0 ? 'Start' : index === 5 ? 'End' : `Batch ${index}`}
                      </span>
                      <span>{trend.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <div className="flex gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]"></span>Completed segments</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>Remaining</div>
              </div>
              <div className="text-xs font-black text-[#16a34a]">
                {overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 100) : 0}% Complete
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Activity & Alerts) */}
        <div className="flex flex-col gap-6">
          
          {/* Live Activity Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#16a34a]" />
                <h3 className="text-sm font-bold text-slate-800">Live Activity Feed</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#16a34a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span> Real-time
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 relative">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-100 z-0"></div>
              
              <div className="flex flex-col gap-5 relative z-10">
                {activityFeed?.map((feed: any, i: number) => {
                  let iconBg = 'bg-[#16a34a]';
                  if (feed.type === 'error') {
                    iconBg = 'bg-red-500';
                  } else if (feed.type === 'info') {
                    iconBg = 'bg-blue-500';
                  }
                  return (
                  <div key={i} className="flex gap-4 group">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 border-white shadow-sm bg-white`}>
                      <span className={`w-2 h-2 rounded-full ${iconBg}`}></span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">
                        {feed.title} <span className="font-medium text-slate-500">- {feed.action}</span>
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{feed.time}</p>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Shortage Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-slate-800">Shortage Alerts</h3>
                <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-[10px] font-bold">{shortageAlerts?.length || 0}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {shortageAlerts?.map((alert: any, i: number) => {
                const bg = alert.severity === 'Critical' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100';
                return (
                <div key={i} className={`p-4 rounded-xl border flex flex-col gap-3 ${bg}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{alert.zone}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] font-bold text-slate-600">{alert.item}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{alert.riders}</p>
                    </div>
                    <button className="bg-[#16a34a] hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                      Assign Backup
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
