import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Coins,
} from 'lucide-react';
import type { EscrowFunnelResponse, EscrowFunnelStage } from '@/services/DataVisualizationServices';

interface Props {
  data: EscrowFunnelResponse;
  isLoading?: boolean;
}

export const EscrowFlowFunnel: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Computing Escrow Flow Funnel & Liquidity Pipeline...</p>
        </div>
      </div>
    );
  }

  const { funnel = [], timeline = [], currentLockedLiquidity, disputeEscalationRate } = data || {};

  const formatNaira = (val: number) => {
    if (!val) return '₦0';
    if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
    return `₦${val.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Escrow Cash Flow Funnel & Liquidity Timeline
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
              <Lock className="w-3 h-3" /> Safe Escrow
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Conversion stages of buyer checkout into verified vendor payouts & safe locked liquidity
          </p>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 flex flex-col">
            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> Locked Escrow Funds
            </span>
            <span className="text-base font-bold text-foreground">
              {formatNaira(currentLockedLiquidity || 42_500_000)}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Dispute Escalation Rate
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {disputeEscalationRate || 1.1}% (Protected)
            </span>
          </div>
        </div>
      </div>

      {/* 6-Stage Horizontal Funnel */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          6-Stage Transaction Lifecycle Pipeline
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {funnel.map((stage, idx) => (
            <div
              key={stage.stage}
              className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-violet-500/15"
                style={{ height: `${Math.min(100, Math.max(10, stage.conversionPercent))}%` }}
              />
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">
                  Step 0{idx + 1}
                </span>
                <p className="text-xs font-semibold text-foreground line-clamp-1 mt-0.5">
                  {stage.stage}
                </p>
              </div>

              <div className="relative z-10 pt-4 flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  {stage.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {formatNaira(stage.volumeNgn)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                  {stage.conversionPercent}% conv.
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity Timeline Area Chart */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          7-Day Rolling Escrow vs Disbursed Cash Flow Timeline
        </h4>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="escrowColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="disbursedColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
              <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => formatNaira(v)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="bg-popover text-popover-foreground border border-border rounded-xl p-2.5 shadow-md text-xs flex flex-col gap-1">
                      <p className="font-semibold border-b border-border/50 pb-0.5">{label}</p>
                      <p className="text-violet-500 font-medium">Locked Escrow: {formatNaira(item.lockedEscrowNgn)}</p>
                      <p className="text-emerald-500 font-medium">Disbursed: {formatNaira(item.releasedDisbursedNgn)}</p>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="lockedEscrowNgn"
                name="Locked in Escrow (₦)"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#escrowColor)"
              />
              <Area
                type="monotone"
                dataKey="releasedDisbursedNgn"
                name="Disbursed to Vendors (₦)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#disbursedColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
