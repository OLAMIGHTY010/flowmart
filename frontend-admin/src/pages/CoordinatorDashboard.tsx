
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Users, 
  Map as MapIcon, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { CoordinatorAnalyticsServices } from '@/services/CoordinatorAnalyticsServices';

export default function CoordinatorDashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['coordOverview'],
    queryFn: CoordinatorAnalyticsServices.getOverview
  });
  
  const { data: eventMetrics } = useQuery({
    queryKey: ['coordEventMetrics'],
    queryFn: CoordinatorAnalyticsServices.getEventMetrics
  });

  const { data: zonePerformance } = useQuery({
    queryKey: ['coordZonePerformance'],
    queryFn: CoordinatorAnalyticsServices.getZonePerformance
  });

  const { data: activityFeed } = useQuery({
    queryKey: ['coordLiveActivityFeed'],
    queryFn: CoordinatorAnalyticsServices.getLiveActivityFeed
  });



  if (overviewLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16a34a]"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <span className="bg-green-100 text-[#16a34a] px-2 py-1 rounded font-bold text-[10px] uppercase">Completed</span>;
      case 'Scheduled': return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Scheduled</span>;
      case 'In progress': return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold text-[10px] uppercase">In progress</span>;
      case 'Critical': return <span className="bg-red-100 text-red-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Critical</span>;
      case 'Paused': return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Paused</span>;
      case 'Flagged': return <span className="bg-red-100 text-red-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Flagged</span>;
      default: return null;
    }
  };

  const zoneProgress = zonePerformance?.map(zp => {
    const percent = Math.round((zp.delivered / zp.allocated) * 100);
    let status = 'Pending';
    if (percent >= 90) status = 'Completed';
    else if (percent >= 50) status = 'In progress';
    else status = 'Critical';
    return { name: `Zone ${zp.zone}`, percent, status };
  }) || [];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto min-h-full pb-10 font-body">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">RCCG Redemption Camp - Live Operations Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#16a34a] hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Allocations</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#16a34a] mb-1">
              {overview?.totalQrDistributed ? overview.totalQrDistributed.toLocaleString() : '0'} <span className="text-xs font-bold text-slate-400">units</span>
            </h3>
            <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
              ↑ {overview?.qrGrowth || 0}% <span className="text-slate-400 font-medium ml-1">vs last event</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivered Zones</span>
            <div className="w-8 h-8 rounded-full border-2 border-[#16a34a] flex items-center justify-center text-[10px] font-black text-[#16a34a]">
              {overview?.totalZones ? Math.round((overview.deliveredZones / overview.totalZones) * 100) : 0}%
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#16a34a] mb-1">
              {overview?.deliveredZones || 0} <span className="text-xs font-bold text-slate-400">/ {overview?.totalZones || 0}</span>
            </h3>
            <div className="text-xs font-medium text-slate-500">zones</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Deliveries</span>
            <Package size={16} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {overview?.pendingZones || 0} <span className="text-xs font-bold text-slate-400">zones</span>
            </h3>
            <div className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block">Awaiting dispatch</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Riders Active</span>
            <div className="flex items-center gap-1 text-[#16a34a]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></div>
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">
              {overview?.activeRiders ? overview.activeRiders.toLocaleString() : '0'} <span className="text-xs font-bold text-slate-400">riders</span>
            </h3>
            <div className="text-xs font-medium text-slate-500">of {overview?.totalRiders ? overview.totalRiders.toLocaleString() : '0'} deployed</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shortage Alerts</span>
            <div className="p-1.5 bg-red-50 text-red-500 rounded-full">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-red-600 mb-1">
              {overview?.criticalAlerts || 0} <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Critical</span>
            </h3>
            <div className="text-[10px] font-bold text-red-600 leading-tight">Requires immediate Action</div>
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Zone Delivery Progress) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Zone Delivery Progress</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Live completion status across all distribution zones</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600">
                <MapIcon size={12} /> {zoneProgress.length} Zones
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-5">
              {zoneProgress.map((zone, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 shrink-0 text-xs font-bold text-slate-700">{zone.name}</div>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${zone.status === 'Critical' ? 'bg-red-500' : 'bg-[#16a34a]'}`} 
                      style={{ width: `${zone.percent}%` }}
                    ></div>
                  </div>
                  <div className="w-10 shrink-0 text-right text-xs font-bold text-slate-700">{zone.percent}%</div>
                  <div className="w-20 shrink-0 text-right">
                    {getStatusBadge(zone.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Live Activity Feed) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Live Activity Feed</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Latest logistics updates from the field</p>
              </div>
              <Activity size={16} className="text-[#16a34a]" />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-100 z-0"></div>
              
              <div className="flex flex-col gap-4 relative z-10">
                {activityFeed?.map((feed: any, i: number) => {
                  let icon = CheckCircle2;
                  let iconBg = 'bg-green-100 text-[#16a34a]';
                  if (feed.type === 'error') {
                    icon = AlertTriangle;
                    iconBg = 'bg-red-100 text-red-500';
                  } else if (feed.type === 'info') {
                    icon = Users;
                    iconBg = 'bg-blue-100 text-blue-600';
                  }
                  const Icon = icon;
                  return (
                  <div key={i} className="flex gap-3 group">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 border-2 border-white shadow-sm ${iconBg}`}>
                      <Icon size={10} strokeWidth={3} />
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex-1">
                      <h4 className="text-[11px] font-bold text-slate-800">{feed.title} - {feed.action}</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{feed.time}</p>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Events Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Events</h3>
            <p className="text-xs text-slate-400 font-medium">Operational history for the latest welfare distribution activities</p>
          </div>
          <button className="text-[10px] font-bold text-[#16a34a] bg-green-50 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            View All
          </button>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">Event Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Zones</th>
                <th className="py-3 px-4">Allocations</th>
                <th className="py-3 px-4 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {eventMetrics?.map((event, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-800">{event.name}</td>
                  <td className="py-4 px-4 text-slate-500 font-medium">{event.date}</td>
                  <td className="py-4 px-4 font-medium text-slate-700">{event.zones} Zones</td>
                  <td className="py-4 px-4 font-medium text-slate-700">{event.qrIds.toLocaleString()} units</td>
                  <td className="py-4 px-4">{getStatusBadge(event.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
