import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  PieChart as PieIcon,
  Star,
  Coins,
  HelpCircle,
  AlertTriangle,
  Award,
  Layers,
} from 'lucide-react';
import type { ParetoMatrixResponse, ParetoProductItem } from '@/services/DataVisualizationServices';

interface Props {
  data: ParetoMatrixResponse;
  isLoading?: boolean;
}

export const ParetoMatrixChart: React.FC<Props> = ({ data, isLoading }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('ALL');

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-pulse min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Computing 80/20 Pareto Curve & BCG Matrix...</p>
        </div>
      </div>
    );
  }

  const { paretoCurve = [], bcgSummary, stats } = data || {};

  const filteredItems = selectedQuadrant === 'ALL'
    ? paretoCurve
    : paretoCurve.filter((item) => item.bcgQuadrant === selectedQuadrant);

  const formatNaira = (val: number) => {
    if (!val) return '₦0';
    if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
    return `₦${val.toLocaleString()}`;
  };

  const getBcgBadge = (quadrant: ParetoProductItem['bcgQuadrant']) => {
    switch (quadrant) {
      case 'STAR':
        return { label: 'Star', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Star };
      case 'CASH_COW':
        return { label: 'Cash Cow', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Coins };
      case 'QUESTION_MARK':
        return { label: 'Opportunity', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: HelpCircle };
      case 'STAGNANT':
      default:
        return { label: 'Stagnant', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: AlertTriangle };
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <PieIcon className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              80/20 Pareto Revenue Curve & BCG Matrix
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Award className="w-3 h-3" /> Vital 20%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizing cumulative product contribution vs catalog share to isolate high-yield profit drivers
          </p>
        </div>

        {/* Vital Few Banner */}
        <div className="flex items-center gap-3 bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5">
          <Layers className="w-5 h-5 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Pareto Concentration</span>
            <span className="text-sm font-bold text-foreground">
              Top {stats?.vitalFewShareOfCatalog || 20}% of items drive 80% of revenue
            </span>
          </div>
        </div>
      </div>

      {/* BCG Quadrant Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'STAR' ? 'ALL' : 'STAR')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            selectedQuadrant === 'STAR'
              ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4 fill-amber-500/20" /> Stars
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20">
              {bcgSummary?.stars || 0}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">High Growth & High Share</p>
        </button>

        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'CASH_COW' ? 'ALL' : 'CASH_COW')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            selectedQuadrant === 'CASH_COW'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-4 h-4" /> Cash Cows
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20">
              {bcgSummary?.cashCows || 0}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Steady Core Profit Engines</p>
        </button>

        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'QUESTION_MARK' ? 'ALL' : 'QUESTION_MARK')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            selectedQuadrant === 'QUESTION_MARK'
              ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-4 h-4" /> Opportunities
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20">
              {bcgSummary?.questionMarks || 0}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">High Velocity Potential</p>
        </button>

        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'STAGNANT' ? 'ALL' : 'STAGNANT')}
          className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-1 ${
            selectedQuadrant === 'STAGNANT'
              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30'
              : 'bg-card border-border hover:bg-muted/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Stagnant
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20">
              {bcgSummary?.stagnant || 0}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Slow Turnaround / Discount</p>
        </button>
      </div>

      {/* Dual Axis Composed Chart */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={paretoCurve} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              interval={0}
              angle={-25}
              textAnchor="end"
              tickFormatter={(name) => (name.length > 12 ? `${name.substring(0, 10)}...` : name)}
            />
            <YAxis
              yAxisId="left"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => formatNaira(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0]?.payload as ParetoProductItem;
                const badge = getBcgBadge(item.bcgQuadrant);
                return (
                  <div className="bg-popover text-popover-foreground border border-border rounded-xl p-3 shadow-lg text-xs flex flex-col gap-1.5">
                    <p className="font-semibold border-b border-border/50 pb-1">{item.name}</p>
                    <p className="text-primary font-medium">Revenue: {formatNaira(item.revenue)}</p>
                    <p className="text-amber-500 font-semibold">
                      Cumulative Contribution: {item.cumulativePercent}%
                    </p>
                    <p className="text-muted-foreground">Units Sold: {item.unitsSold.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                      {badge.label} Quadrant
                    </span>
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
            <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '80% Pareto Cutoff', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Product Revenue (₦)"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercent"
              name="Cumulative % Curve"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Item Table View */}
      {filteredItems.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Revenue (₦)</th>
                  <th className="py-2.5 px-3">Units</th>
                  <th className="py-2.5 px-3">Cum. %</th>
                  <th className="py-2.5 px-3">BCG Matrix</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.slice(0, 5).map((prod) => {
                  const badge = getBcgBadge(prod.bcgQuadrant);
                  const IconComp = badge.icon;
                  return (
                    <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{prod.name}</td>
                      <td className="py-2 px-3 font-semibold text-primary">{formatNaira(prod.revenue)}</td>
                      <td className="py-2 px-3 text-muted-foreground">{prod.unitsSold}</td>
                      <td className="py-2 px-3 font-bold text-amber-500">{prod.cumulativePercent}%</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                          <IconComp className="w-2.5 h-2.5" /> {badge.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{prod.marginPercent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
