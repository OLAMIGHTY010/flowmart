import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
} from 'lucide-react';
import type { LogisticsSlaResponse, ZoneSlaItem } from '@/services/DataVisualizationServices';

interface Props {
  data: LogisticsSlaResponse;
  isLoading?: boolean;
}

export const LogisticsSlaHeatmap: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Analyzing Logistics Dispatch & SLA Heatmap...</p>
        </div>
      </div>
    );
  }

  const { zones = [], summary } = data || {};

  const getStatusBadge = (status: ZoneSlaItem['status']) => {
    switch (status) {
      case 'OPTIMAL':
        return {
          label: 'Optimal SLA',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          barColor: '#10b981',
        };
      case 'MODERATE':
        return {
          label: 'Moderate Traffic',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          barColor: '#f59e0b',
        };
      case 'CONGESTED':
      default:
        return {
          label: 'Congested Zone',
          badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          barColor: '#ef4444',
        };
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Truck className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Hyper-Local Logistics SLA & Turnaround Heatmap
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Clock className="w-3 h-3" /> Live Dispatch
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time fulfillment metrics, zone congestion scoring, and rider dispatch density
          </p>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Platform SLA
            </span>
            <span className="text-base font-bold text-foreground">
              {summary?.avgPlatformSla || 93.4}%
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-muted/50 border border-border flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Total Delivered</span>
            <span className="text-base font-bold text-foreground">
              {summary?.totalDelivered?.toLocaleString() || '18,110'} orders
            </span>
          </div>
        </div>
      </div>

      {/* Zone SLA Comparison Bar Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={zones} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" horizontal={false} />
            <XAxis type="number" stroke="#888888" fontSize={11} domain={[0, 50]} unit=" min" />
            <YAxis
              type="category"
              dataKey="zone"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              width={140}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const z = payload[0]?.payload as ZoneSlaItem;
                const statusMeta = getStatusBadge(z.status);
                return (
                  <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg text-xs flex flex-col gap-1.5">
                    <p className="font-semibold border-b border-border/50 pb-1">{z.zone}</p>
                    <p className="text-blue-500 font-medium">Avg Delivery Time: {z.avgDeliveryMinutes || z.avgMin} mins</p>
                    <p className="text-emerald-500 font-medium">SLA Adherence: {z.slaAdherencePercent || z.sla}%</p>
                    <p className="text-muted-foreground">
                      Completed: {(z.deliveredOrders || z.delivered).toLocaleString()} | Cancelled: {z.cancelledOrders || z.cancelled}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${statusMeta.badge}`}>
                      {statusMeta.label}
                    </span>
                  </div>
                );
              }}
            />
            <Bar dataKey="avgDeliveryMinutes" name="Avg Delivery Turnaround (Mins)" radius={[0, 6, 6, 0]}>
              {zones.map((entry) => (
                <Cell key={entry.zone} fill={getStatusBadge(entry.status).barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone Status Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map((zone) => {
          const statusMeta = getStatusBadge(zone.status);
          return (
            <div
              key={zone.zone}
              className="bg-card border border-border rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-xs text-foreground leading-tight">
                    {zone.zone}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.badge}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border/60">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">Turnaround</span>
                  <span className="text-xs font-bold text-foreground">
                    {zone.avgDeliveryMinutes || zone.avgMin}m
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">SLA Rate</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {zone.slaAdherencePercent || zone.sla}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">Riders</span>
                  <span className="text-xs font-bold text-primary flex items-center justify-center gap-0.5">
                    <Users className="w-2.5 h-2.5" />
                    {zone.activeRiders || zone.riders}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
