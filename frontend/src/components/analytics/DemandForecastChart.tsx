import React, { useState } from 'react';
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
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { DemandTrajectoryResponse } from '@/services/DataVisualizationServices';

interface Props {
  data: DemandTrajectoryResponse;
  isLoading?: boolean;
}

export const DemandForecastChart: React.FC<Props> = ({ data, isLoading }) => {
  const [selectedElasticityIndex, setSelectedElasticityIndex] = useState<number>(2); // Default 0% change

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Computing Holt-Winters Demand Trajectory...</p>
        </div>
      </div>
    );
  }

  const { trajectory = [], elasticityPoints = [], summary } = data || {};
  const currentElasticity = elasticityPoints[selectedElasticityIndex] || elasticityPoints[0] || {
    priceChangePercent: 0,
    projectedUnits: 0,
    projectedRevenue: 0,
    projectedGrossMargin: 0,
  };

  const formatNaira = (val: number) => {
    if (!val) return '₦0';
    if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
    return `₦${val.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header & KPI Summary Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Predictive Demand Trajectory & Elasticity
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" /> Holt-Linear ML
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            30-day historical actuals combined with 14-day exponential smoothing projection & confidence bands
          </p>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-muted/50 border border-border/80 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Projected 30D Revenue</span>
            <span className="text-base font-bold text-foreground">
              {formatNaira(summary?.projected30DayRevenue || 0)}
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Demand Velocity
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              +{summary?.demandGrowthRate || 0}% / mo
            </span>
          </div>
        </div>
      </div>

      {/* Trajectory Area Chart */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="projectedColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              tickFormatter={(d) => {
                const parts = d.split('-');
                return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d;
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => formatNaira(v)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload;
                return (
                  <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg text-xs flex flex-col gap-1.5">
                    <p className="font-semibold border-b border-border/50 pb-1">{label}</p>
                    {point.actualRevenue !== undefined && (
                      <p className="text-emerald-500 font-medium">
                        Actual Revenue: {formatNaira(point.actualRevenue)}
                      </p>
                    )}
                    {point.projectedRevenue !== undefined && (
                      <>
                        <p className="text-indigo-400 font-semibold">
                          Projected Revenue: {formatNaira(point.projectedRevenue)}
                        </p>
                        <p className="text-muted-foreground text-[10px]">
                          Range: {formatNaira(point.lowerConfidenceBound || 0)} — {formatNaira(point.upperConfidenceBound || 0)}
                        </p>
                      </>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="actualRevenue"
              name="Historical Actual (₦)"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#actualColor)"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="upperConfidenceBound"
              name="Confidence Interval"
              stroke="#a5b4fc"
              strokeDasharray="2 2"
              strokeWidth={1}
              fillOpacity={1}
              fill="url(#confidenceBand)"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projectedRevenue"
              name="14-Day ML Forecast (₦)"
              stroke="#6366f1"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#projectedColor)"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Price Elasticity Simulator */}
      {elasticityPoints.length > 0 && (
        <div className="bg-muted/30 border border-border/80 rounded-xl p-4.5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Price Elasticity & Gross Margin "What-If" Simulator
              </h4>
            </div>
            <span className="text-xs text-muted-foreground">
              {summary?.recommendedPriceAction || 'Recommended: test +10% price bump on vital few items'}
            </span>
          </div>

          {/* Stepper Buttons for Elasticity Scenarios */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {elasticityPoints.map((ep, idx) => {
              const isSelected = selectedElasticityIndex === idx;
              return (
                <button
                  key={ep.priceChangePercent}
                  onClick={() => setSelectedElasticityIndex(idx)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <span>
                    {ep.priceChangePercent > 0
                      ? `+${ep.priceChangePercent}%`
                      : `${ep.priceChangePercent}%`} Price
                  </span>
                  <span className={`text-[10px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {ep.priceChangePercent === 0 ? 'Current Baseline' : ep.priceChangePercent > 0 ? 'Margin Boost' : 'Volume Push'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Simulator Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Estimated Units Sold</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {currentElasticity.projectedUnits.toLocaleString()} units
                </p>
              </div>
              <span className={`p-2 rounded-lg ${currentElasticity.priceChangePercent < 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                {currentElasticity.priceChangePercent < 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Projected Revenue</p>
                <p className="text-base font-bold text-primary mt-0.5">
                  {formatNaira(currentElasticity.projectedRevenue)}
                </p>
              </div>
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>

            <div className="bg-card border border-border/70 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Projected Gross Margin</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentElasticity.projectedGrossMargin}%
                </p>
              </div>
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
