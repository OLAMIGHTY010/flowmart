import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Server, 
  Store, 
  Truck, 
  Calendar as CalendarIcon,
  ChevronDown,
  AlertTriangle,
  Search,
  Download
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalyticsServices } from '@/services/AnalyticsServices';

export default function PlatformAnalytics() {
  const [dateRange] = useState('Last 7 Days');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analyticsOverview', dateRange],
    queryFn: AnalyticsServices.getOverview
  });

  const { data: deliveryTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analyticsTrends', dateRange],
    queryFn: AnalyticsServices.getDeliveryTrends
  });

  const { data: vendorPerf, isLoading: vendorLoading } = useQuery({
    queryKey: ['analyticsVendors', dateRange],
    queryFn: AnalyticsServices.getVendorPerformance
  });

  const { data: zonePerf, isLoading: zoneLoading } = useQuery({
    queryKey: ['analyticsZones', dateRange],
    queryFn: AnalyticsServices.getZonePerformance
  });

  if (overviewLoading || trendsLoading || vendorLoading || zoneLoading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto h-full pb-10">
      
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">Platform Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Enterprise Command Center</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
            />
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <CalendarIcon size={16} /> {dateRange} <ChevronDown size={14} />
            </button>
          </div>
          <button 
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}/admin/analytics/export`, '_blank')}
            className="flex items-center gap-2 bg-white border border-success text-success hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Transactions */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Deliveries</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Truck size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-800">{overview?.totalTransactions.toLocaleString()}</h3>
          <div className="flex items-center gap-1 mt-2 text-sm font-bold text-success">
            <TrendingUp size={14} /> +{overview?.transactionGrowth}% <span className="text-slate-400 font-medium ml-1">vs last period</span>
          </div>
        </div>

        {/* SLA Adherence */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Adherence</span>
            <div className="p-2 bg-green-50 text-success rounded-lg">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-800">{overview?.slaAdherence}%</h3>
          <div className="flex items-center gap-1 mt-2 text-sm font-medium text-slate-500">
            <Clock size={14} /> Avg Time: <span className="font-bold text-slate-800">{overview?.averageDeliveryTime} min</span>
          </div>
        </div>

        {/* Active Vendors */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Vendors</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Store size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-black text-slate-800">{overview?.activeVendors}</h3>
          <div className="flex items-center gap-1 mt-2 text-sm font-bold text-success">
            <TrendingUp size={14} /> +{overview?.vendorGrowth}% <span className="text-slate-400 font-medium ml-1">vs last period</span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Uptime</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Server size={18} />
            </div>
          </div>
          <h3 className="text-4xl font-black text-success">{overview?.systemUptime}%</h3>
          <div className="flex items-center gap-1 mt-2 text-sm font-bold text-success">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-1"></div> Operational
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Delivery Trends Area Chart (Spans 2 columns) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Delivery Volume Trend</h3>
              <p className="text-sm text-slate-500 font-medium">Daily completed vs returned deliveries</p>
            </div>
            <div className="flex gap-4 text-sm font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-success"></div>Completed</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-300"></div>Returns</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveryTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                <Area type="monotone" dataKey="returns" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorReturns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Vendor Categories</h3>
            <p className="text-sm text-slate-500 font-medium">Active vendors by business type</p>
          </div>
          
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendorPerf}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category" // Handle mock data key differences
                  stroke="none"
                >
                  {vendorPerf?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800">{overview?.activeVendors}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {vendorPerf?.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-600 truncate max-w-[80px]">{entry.category || (entry as any).facility}</span>
                </div>
                <span className="text-slate-800 font-bold">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Automated Insights Panel */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-md text-white flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
              <BarChart3 size={18} />
            </div>
            <h3 className="text-lg font-bold">Automated Insights</h3>
          </div>
          
          <div className="flex flex-col gap-4 flex-1">
            {overview && overview.slaAdherence < 95 ? (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex gap-3">
                <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-bold text-orange-400">SLA Adherence Alert</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">System-wide SLA adherence has dropped below 95% (Current: {overview.slaAdherence}%). Consider investigating delivery bottlenecks.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex gap-3">
                <ShieldCheck className="text-success shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-bold text-success">Healthy SLA Adherence</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">The platform is currently exceeding target delivery times with {overview?.slaAdherence}% adherence.</p>
                </div>
              </div>
            )}
            
            {overview && overview.vendorGrowth > 5 ? (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex gap-3">
                <TrendingUp className="text-success shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-sm font-bold text-success">Vendor Growth Surge</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">Vendor onboarding has surged with a {overview.vendorGrowth}% growth rate. Ensure sufficient riders are available.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Top Zones Performance (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Zone Performance Matrix</h3>
            <p className="text-sm text-slate-500 font-medium">Delivery completion by zone</p>
          </div>
          
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={zonePerf}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="zone" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completed" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
