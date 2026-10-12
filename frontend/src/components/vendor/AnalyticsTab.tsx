import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PieChart,
  Repeat,
  Truck,
  ShieldCheck,
  Bot,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DataVisualizationServices,
  type DemandTrajectoryResponse,
  type ParetoMatrixResponse,
  type CohortRetentionResponse,
  type LogisticsSlaResponse,
  type EscrowFunnelResponse,
} from '@/services/DataVisualizationServices';
import { DemandForecastChart } from '../analytics/DemandForecastChart';
import { ParetoMatrixChart } from '../analytics/ParetoMatrixChart';
import { CohortRetentionMatrix } from '../analytics/CohortRetentionMatrix';
import { LogisticsSlaHeatmap } from '../analytics/LogisticsSlaHeatmap';
import { EscrowFlowFunnel } from '../analytics/EscrowFlowFunnel';
import { AskYourDataCopilot } from '../analytics/AskYourDataCopilot';

export default function AnalyticsTab() {
  const [activeSubTab, setActiveSubTab] = useState<
    'all' | 'demand' | 'pareto' | 'retention' | 'logistics' | 'escrow'
  >('all');

  const [loading, setLoading] = useState(true);
  const [demandData, setDemandData] = useState<DemandTrajectoryResponse | null>(null);
  const [paretoData, setParetoData] = useState<ParetoMatrixResponse | null>(null);
  const [cohortData, setCohortData] = useState<CohortRetentionResponse | null>(null);
  const [logisticsData, setLogisticsData] = useState<LogisticsSlaResponse | null>(null);
  const [escrowData, setEscrowData] = useState<EscrowFunnelResponse | null>(null);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [demand, pareto, cohort, logistics, escrow] = await Promise.allSettled([
        DataVisualizationServices.getDemandTrajectory(),
        DataVisualizationServices.getParetoMatrix(),
        DataVisualizationServices.getCohortRetention(),
        DataVisualizationServices.getLogisticsSla(),
        DataVisualizationServices.getEscrowFunnel(),
      ]);

      if (demand.status === 'fulfilled') setDemandData(demand.value);
      if (pareto.status === 'fulfilled') setParetoData(pareto.value);
      if (cohort.status === 'fulfilled') setCohortData(cohort.value);
      if (logistics.status === 'fulfilled') setLogisticsData(logistics.value);
      if (escrow.status === 'fulfilled') setEscrowData(escrow.value);
    } catch (err) {
      console.error('Error fetching analytics suite:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const navFilters = [
    { id: 'all', label: 'Complete Suite', icon: SlidersHorizontal },
    { id: 'demand', label: 'Predictive Demand', icon: TrendingUp },
    { id: 'pareto', label: '80/20 Pareto & BCG', icon: PieChart },
    { id: 'retention', label: 'Retention & Cohorts', icon: Repeat },
    { id: 'logistics', label: 'Logistics SLA', icon: Truck },
    { id: 'escrow', label: 'Escrow Liquidity', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Intelligence & Data Analytics Suite
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Holt-Winters demand forecasting, 80/20 Pareto profit drivers, logistics SLAs, and escrow intelligence
          </p>
        </div>

        <button
          onClick={fetchAllAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </button>
      </div>

      {/* Subtab Navigation Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {navFilters.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 6. Ask Your Data AI Copilot */}
      <AskYourDataCopilot />

      {/* Module 1: Predictive Demand & Price Elasticity */}
      {(activeSubTab === 'all' || activeSubTab === 'demand') && demandData && (
        <DemandForecastChart data={demandData} isLoading={loading} />
      )}

      {/* Module 2: 80/20 Pareto & BCG Matrix */}
      {(activeSubTab === 'all' || activeSubTab === 'pareto') && paretoData && (
        <ParetoMatrixChart data={paretoData} isLoading={loading} />
      )}

      {/* Module 3: Customer Cohorts & Retention */}
      {(activeSubTab === 'all' || activeSubTab === 'retention') && cohortData && (
        <CohortRetentionMatrix data={cohortData} isLoading={loading} />
      )}

      {/* Module 4: Logistics SLA Heatmap */}
      {(activeSubTab === 'all' || activeSubTab === 'logistics') && logisticsData && (
        <LogisticsSlaHeatmap data={logisticsData} isLoading={loading} />
      )}

      {/* Module 5: Escrow Cash Flow Funnel & Liquidity */}
      {(activeSubTab === 'all' || activeSubTab === 'escrow') && escrowData && (
        <EscrowFlowFunnel data={escrowData} isLoading={loading} />
      )}
    </div>
  );
}
