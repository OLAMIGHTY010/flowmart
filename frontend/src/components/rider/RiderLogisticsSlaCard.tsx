import React, { useState, useEffect } from 'react';
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  DataVisualizationServices,
  type LogisticsSlaResponse,
  type ZoneSlaItem,
} from '@/services/DataVisualizationServices';

export default function RiderLogisticsSlaCard() {
  const [data, setData] = useState<LogisticsSlaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogistics = async () => {
    setLoading(true);
    try {
      const res = await DataVisualizationServices.getLogisticsSla();
      setData(res);
    } catch (err) {
      console.error('Failed to load logistics SLA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  const getStatusBadge = (status: ZoneSlaItem['status']) => {
    switch (status) {
      case 'OPTIMAL':
        return {
          label: 'Optimal Route',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          indicator: 'bg-emerald-500',
        };
      case 'MODERATE':
        return {
          label: 'Moderate Traffic',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          indicator: 'bg-amber-500',
        };
      case 'CONGESTED':
      default:
        return {
          label: 'Congested Zone',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          indicator: 'bg-rose-500',
        };
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
            <Truck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Zone Logistics & SLA Intelligence
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Sparkles className="w-2.5 h-2.5 inline mr-1" /> Live Dispatch
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time delivery turnaround and congestion scoring across fulfillment hubs
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogistics}
          disabled={loading}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh zone data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Summary Pill Row */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">Platform SLA</span>
            <span className="text-base font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {data.summary.avgPlatformSla}%
            </span>
          </div>

          <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">Total Delivered</span>
            <span className="text-base font-bold text-foreground mt-0.5">
              {data.summary.totalDelivered.toLocaleString()}
            </span>
          </div>

          <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">Fastest Corridor</span>
            <span className="text-xs font-bold text-primary truncate mt-1">
              {data.summary.topPerformingZone}
            </span>
          </div>

          <div className="bg-muted/40 border border-border/80 rounded-xl p-3 flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">Congestion Alert</span>
            <span className="text-xs font-bold text-rose-500 truncate mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {data.summary.bottleneckZone}
            </span>
          </div>
        </div>
      )}

      {/* Zone Cards Grid */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Syncing dispatch zone metrics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {data?.zones?.map((zone) => {
            const badge = getStatusBadge(zone.status);
            return (
              <div
                key={zone.zone}
                className="bg-card border border-border/80 hover:border-primary/30 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${badge.indicator}`} />
                    <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                      {zone.zone}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/60 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Avg Time
                    </span>
                    <span className="text-xs font-bold text-foreground mt-0.5">
                      {zone.avgDeliveryMinutes || zone.avgMin}m
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">SLA Rate</span>
                    <span className="text-xs font-bold text-emerald-600 mt-0.5">
                      {zone.slaAdherencePercent || zone.sla}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> Riders
                    </span>
                    <span className="text-xs font-bold text-primary mt-0.5">
                      {zone.activeRiders || zone.riders}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
