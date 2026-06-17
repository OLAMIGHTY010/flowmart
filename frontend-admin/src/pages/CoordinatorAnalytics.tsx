import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { CoordinatorAnalyticsServices } from '@/services/CoordinatorAnalyticsServices';

export default function CoordinatorAnalytics() {
  const [dateRange] = useState('Dec 1 – Dec 31, 2024');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['coordOverview'],
    queryFn: CoordinatorAnalyticsServices.getOverview
  });
  const { data: deliveryTrends } = useQuery({
    queryKey: ['coordDeliveryTrends'],
    queryFn: CoordinatorAnalyticsServices.getDeliveryTrends
  });
  const { data: zonePerformance } = useQuery({
    queryKey: ['coordZonePerformance'],
    queryFn: CoordinatorAnalyticsServices.getZonePerformance
  });
  const { data: riderEfficiency } = useQuery({
    queryKey: ['coordRiderEfficiency'],
    queryFn: CoordinatorAnalyticsServices.getRiderEfficiency
  });
  const { data: eventMetrics } = useQuery({
    queryKey: ['coordEventMetrics'],
    queryFn: CoordinatorAnalyticsServices.getEventMetrics
  });
  const { data: shortageIncidents } = useQuery({
    queryKey: ['coordShortageIncidents'],
    queryFn: CoordinatorAnalyticsServices.getShortageIncidents
  });

  if (overviewLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16a34a]"></div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'None': return 'bg-green-100 text-green-700';
      case 'Low': return 'bg-green-300 text-green-800';
      case 'Moderate': return 'bg-orange-300 text-orange-900';
      case 'High': return 'bg-orange-500 text-white';
      case 'Critical': return 'bg-red-600 text-white';
      default: return 'bg-slate-100';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <span className="bg-green-100 text-[#16a34a] px-2 py-1 rounded font-bold text-[10px] uppercase">Completed</span>;
      case 'Scheduled': return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Scheduled</span>;
      case 'Paused': return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Paused</span>;
      case 'Flagged': return <span className="bg-red-100 text-red-600 px-2 py-1 rounded font-bold text-[10px] uppercase">Flagged</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto min-h-full pb-10 font-body">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">Analytics & Insights</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Performance overview across all events and zones.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
            <CalendarIcon size={16} className="text-slate-400" />
            {dateRange}
            <ChevronDown size={14} className="text-slate-400 ml-2" />
          </button>
          <button className="flex items-center gap-2 bg-[#16a34a] hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivery Success Rate</span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#16a34a] mb-1">{overview?.deliverySuccessRate}%</h3>
            <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
              ↑ {overview?.successRateGrowth}% <span className="text-slate-400 font-medium ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total QR/ID Distributed</span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#16a34a] mb-1">{overview?.totalQrDistributed.toLocaleString()}</h3>
            <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
              ↑ {overview?.qrGrowth}% <span className="text-slate-400 font-medium ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg. Event Completion Time</span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#16a34a] mb-1">{overview?.avgCompletionTime}</h3>
            <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
              ↓ {overview?.completionTimeTrend} <span className="text-slate-400 font-medium ml-1">vs last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rider Efficiency Score</span>
            <TrendingUp size={14} className="text-[#16a34a]" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#16a34a] mb-1">{overview?.riderEfficiencyScore}%</h3>
            <div className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
              ↑ {overview?.riderEfficiencyGrowth}% <span className="text-slate-400 font-medium ml-1">vs last month</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Line Chart & Grouped Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Delivery Success Rate Over Time</h3>
              <p className="text-xs text-slate-400 font-medium">Success rate % across all events</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0.6, 1]} tickFormatter={(val) => val.toFixed(1)} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Zone Performance Comparison</h3>
              <p className="text-xs text-slate-400 font-medium">Allocated vs Delivered units per zone</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="flex gap-4 text-xs font-bold mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-300"></div>Allocated</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#16a34a]"></div>Delivered</div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zonePerformance} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="allocated" fill="#86efac" radius={[2, 2, 0, 0]} barSize={10} />
                <Bar dataKey="delivered" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Horizontal Bar Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Horizontal Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Rider Efficiency Distribution</h3>
              <p className="text-xs text-slate-400 font-medium">Top 10 riders by efficiency score</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riderEfficiency} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={50} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={12}>
                  {/* Assuming we want small labels on the right of the bar, Recharts handles Tooltip instead to keep it clean */}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px] overflow-hidden">
          <div className="flex justify-between items-start mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Event Metrics Summary</h3>
              <p className="text-xs text-slate-400 font-medium">Recent 5 events performance</p>
            </div>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-3 pr-4">Event Name</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4 text-center">Zones</th>
                  <th className="pb-3 pr-4 text-center">Riders</th>
                  <th className="pb-3 pr-4 text-right">QR/ID</th>
                  <th className="pb-3 pr-4 text-right">Ratio</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eventMetrics?.map((event, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4 font-bold text-slate-800">{event.name}</td>
                    <td className="py-4 pr-4 text-slate-500 font-medium">{event.date}</td>
                    <td className="py-4 pr-4 text-center font-medium text-slate-700">{event.zones}</td>
                    <td className="py-4 pr-4 text-center font-medium text-slate-700">{event.riders}</td>
                    <td className="py-4 pr-4 text-right font-medium text-slate-700">{event.qrIds.toLocaleString()}</td>
                    <td className="py-4 pr-4 text-right font-bold text-[#16a34a]">{event.ratio}</td>
                    <td className="py-4">{getStatusBadge(event.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Row 4: Heatmap */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Shortage Incident Analysis</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Delay and mismatch report breakdowns across zones balancing metric risks to flag severity.</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-100"></div>None</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-300"></div>Low</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-orange-300"></div>Moderate</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-orange-500"></div>High</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-600"></div>Critical</div>
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={14} /> Download Heatmap
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-center text-xs whitespace-nowrap min-w-[800px] border-separate border-spacing-y-2 border-spacing-x-1">
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="pb-2 text-left px-2">Zone</th>
                <th className="pb-2 px-2">Vendor Mismatch Rate</th>
                <th className="pb-2 px-2">Riders Current Day</th>
                <th className="pb-2 px-2">Team Counts Dist.</th>
                <th className="pb-2 px-2">Vendor Daily Run</th>
                <th className="pb-2 px-2">Mid-Day 1</th>
                <th className="pb-2 px-2">Mid-Day 2</th>
                <th className="pb-2 px-2">Mid-Day 3</th>
              </tr>
            </thead>
            <tbody>
              {shortageIncidents?.map((row, i) => (
                <tr key={i}>
                  <td className="py-2 px-2 text-left font-bold text-slate-700">{row.zone}</td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.vendorMismatchRate)}`}>{row.vendorMismatchRate === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.ridersCurrentDay)}`}>{row.ridersCurrentDay === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.teamCountsDist)}`}>{row.teamCountsDist === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.vendorDailyRun)}`}>{row.vendorDailyRun === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.midDay1)}`}>{row.midDay1 === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.midDay2)}`}>{row.midDay2 === 'None' ? '-' : '!'}</div></td>
                  <td className="px-2"><div className={`h-8 rounded w-full flex items-center justify-center font-bold text-[10px] ${getSeverityColor(row.midDay3)}`}>{row.midDay3 === 'None' ? '-' : '!'}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
