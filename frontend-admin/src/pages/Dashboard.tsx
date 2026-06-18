
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Activity,
  Package,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  CreditCard,
  Settings,
  FileText,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AdminDashboardServices } from '@/services/AdminDashboardServices';

const chartConfig = {
  deliveries: {
    label: "Deliveries",
    color: "#22c55e",
  },
  returns: {
    label: "Returns",
    color: "#cbd5e1",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: AdminDashboardServices.getStats
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['adminDashboardChart'],
    queryFn: AdminDashboardServices.getChartData
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['adminDashboardAlerts'],
    queryFn: AdminDashboardServices.getAlerts
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['adminDashboardActivity'],
    queryFn: AdminDashboardServices.getActivity
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['adminDashboardHealth'],
    queryFn: AdminDashboardServices.getHealth
  });

  if (statsLoading || chartLoading || alertsLoading || activitiesLoading || healthLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16a34a]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {/* Active Users */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Users</span>
            <div className="p-1.5 bg-green-100 text-green-600 rounded-md">
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 font-headings">{stats?.activeUsers?.toLocaleString()}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-green-600">
              <span className="text-slate-400 font-medium">Registered users</span>
            </div>
          </div>
        </div>

        {/* Active Events */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Events</span>
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md">
              <Activity size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 font-headings">{stats?.activeEvents}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-slate-400">
              <Clock size={14} />
              <span className="font-medium">Currently active</span>
            </div>
          </div>
        </div>

        {/* Deliveries Today */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deliveries Today</span>
            <div className="p-1.5 bg-green-100 text-green-600 rounded-md">
              <Package size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 font-headings">{stats?.deliveriesToday?.toLocaleString()}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-green-600">
              <CheckCircle2 size={14} />
              <span className="text-slate-400 font-medium">Today's total</span>
            </div>
          </div>
        </div>

        {/* Platform Uptime */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Uptime</span>
            <div className="p-1.5 bg-green-100 text-green-600 rounded-md">
              <Zap size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 font-headings">{stats?.platformUptime}%</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-green-600">
              <span className="flex w-2 h-2 rounded-full bg-green-500"></span>
              <span>Operational</span>
            </div>
          </div>
        </div>

      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {healthData?.map((item, index) => {
          const isOperational = item.status === 'Operational';
          const colorClass = isOperational ? 'text-success' : 'text-orange-500';
          const bgClass = isOperational ? 'bg-success' : 'bg-orange-500';

          return (
            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${colorClass}`}>
                  <div className={`w-2 h-2 rounded-full ${bgClass}`}></div> {item.status}
                </div>
              </div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Latency</p>
                  <p className="text-2xl font-black text-slate-800">{item.latency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium mb-1">Uptime</p>
                  <p className="text-2xl font-black text-slate-800">{item.uptime}%</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`${bgClass} h-full`} style={{ width: `${item.uptime}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Delivery Metrics Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Delivery Metrics</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">7-day delivery volume trend</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                <span className="text-slate-600">Deliveries</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-300"></div>
                <span className="text-slate-600">Returns</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-deliveries)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-deliveries)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="deliveries"
                  stroke="var(--color-deliveries)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDeliveries)"
                />
                <Area
                  type="monotone"
                  dataKey="returns"
                  stroke="var(--color-returns)"
                  strokeWidth={2}
                  fill="transparent"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <div>
            <h2 className="text-base font-bold text-slate-800">Critical Alerts</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Require immediate attention</p>
          </div>

          <div className="mt-5 flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
            {alerts?.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border flex flex-col gap-2 ${alert.type === 'critical' ? 'bg-red-50 border-red-100' :
                    alert.type === 'warning' ? 'bg-orange-50 border-orange-100' :
                      'bg-green-50 border-green-100'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                      alert.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                    <div className="flex items-center gap-1">
                      {alert.type === 'critical' && <AlertCircle size={10} />}
                      {alert.type === 'warning' && <AlertCircle size={10} />}
                      {alert.type === 'info' && <Info size={10} />}
                      {alert.type}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{alert.time}</span>
                </div>
                <p className={`text-xs font-semibold leading-relaxed ${alert.type === 'critical' ? 'text-red-900' :
                    alert.type === 'warning' ? 'text-orange-900' :
                      'text-green-900'
                  }`}>
                  {alert.title}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Latest platform events across all modules</p>
          </div>
          <button className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors">
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activities?.map((activity) => {
            const getTagStyle = (type: string) => {
              switch (type) {
                case 'Vendor': return 'bg-green-100 text-green-700';
                case 'Delivery': return 'bg-blue-100 text-blue-700';
                case 'Wallet': return 'bg-red-100 text-red-700';
                case 'Audit Log': return 'bg-orange-100 text-orange-700';
                case 'Settings': return 'bg-slate-100 text-slate-700';
                default: return 'bg-slate-100 text-slate-700';
              }
            };

            const getIcon = (type: string) => {
              switch (type) {
                case 'Vendor': return <UserCheck size={14} />;
                case 'Delivery': return <Package size={14} />;
                case 'Wallet': return <CreditCard size={14} />;
                case 'Audit Log': return <FileText size={14} />;
                case 'Settings': return <Settings size={14} />;
                default: return <Info size={14} />;
              }
            };

            return (
              <div key={activity.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 group-hover:border-slate-300 transition-colors`}>
                    {getIcon(activity.type)}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{activity.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTagStyle(activity.type)}`}>
                    {activity.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 min-w-[50px] text-right">{activity.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
