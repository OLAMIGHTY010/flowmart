import React, { useEffect, useState } from 'react';
import {
  Zap,
  Play,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Globe,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { adminAutomationServices } from '../services/AutomationServices';

export const AdminAutomationControlPanel: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [heartbeatRunning, setHeartbeatRunning] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [newThreshold, setNewThreshold] = useState<number>(5000);
  const [quarantineInput, setQuarantineInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminAutomationServices.getDashboardMetrics();
      if (res?.metrics) {
        setMetrics(res.metrics);
        if (res.metrics.disputes?.microThresholdNgn) {
          setNewThreshold(res.metrics.disputes.microThresholdNgn);
        }
      }
    } catch (err) {
      console.error('Failed to load admin automation metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleHeartbeat = async () => {
    setHeartbeatRunning(true);
    try {
      const res = await adminAutomationServices.triggerHeartbeat();
      setStatusMessage(`Autonomous cycle executed: ${res?.heartbeat?.cascadesProcessed || 0} cascades, ${res?.heartbeat?.payoutsSwept?.sweptCount || 0} payouts swept.`);
      fetchMetrics();
    } catch (err) {
      setStatusMessage('Error executing autonomous cycle.');
    } finally {
      setHeartbeatRunning(false);
    }
  };

  const handleUpdateThreshold = async () => {
    try {
      await adminAutomationServices.updateDisputeThreshold(newThreshold);
      setStatusMessage(`Micro-dispute auto-resolution threshold updated to ₦${newThreshold.toLocaleString()}`);
      fetchMetrics();
    } catch (err) {
      setStatusMessage('Failed to update threshold.');
    }
  };

  const handleLiftQuarantine = async () => {
    if (!quarantineInput) return;
    try {
      const res = await adminAutomationServices.liftQuarantine(quarantineInput);
      setStatusMessage(`Quarantine lifted for entity: ${quarantineInput}`);
      setQuarantineInput('');
      fetchMetrics();
    } catch (err) {
      setStatusMessage('Failed to lift quarantine.');
    }
  };

  const handleSyncFx = async () => {
    try {
      await adminAutomationServices.syncFxRates();
      setStatusMessage('Exchange rates synchronized across NGN, USD, GBP, EUR, KES, GHS, ZAR.');
      fetchMetrics();
    } catch (err) {
      setStatusMessage('Failed to sync FX rates.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Autonomous Operations Control Plane
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                Autonomous 24/7
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Coordinating all 7 autonomous engines across Vendors, Riders, Buyers, and Platform Logistics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleHeartbeat}
            disabled={heartbeatRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            {heartbeatRunning ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Trigger Autonomous Heartbeat
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {statusMessage}
        </div>
      )}

      {/* 7 Engines Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Logistics Dispatch & Cascade */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Logistics Cascade Queue</span>
          <div className="text-2xl font-bold text-amber-400">
            {metrics?.logistics?.activeSessions || 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics?.logistics?.totalCascades || 0} total auto-reassignments
          </p>
        </div>

        {/* 2. Micro-Dispute Fast-Track */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Auto-Arbitrated Disputes</span>
          <div className="text-2xl font-bold text-emerald-400">
            {metrics?.disputes?.autoResolutionRate || 100}%
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics?.disputes?.autoResolvedMicro || 0} micro-refunds &lt;₦{newThreshold.toLocaleString()}
          </p>
        </div>

        {/* 3. Escrow Payout Sweeps */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Auto-Swept Payouts</span>
          <div className="text-2xl font-bold text-blue-400">
            ₦{(metrics?.payouts?.totalPaidNgn || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">
            ₦{(metrics?.payouts?.totalHeldReserveNgn || 0).toLocaleString()} rolling reserve held
          </p>
        </div>

        {/* 4. Anti-Fraud Risk Posture */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Anti-Fraud Posture</span>
          <div className="text-2xl font-bold text-purple-400">
            {metrics?.fraud?.overallRiskPosture || 'STABLE'}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics?.fraud?.currentlyQuarantinedCount || 0} entities quarantined
          </p>
        </div>
      </div>

      {/* Control Actions & Overrides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Control 1: Micro-Dispute Threshold */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Micro-Dispute Auto Threshold
          </h4>
          <div className="flex gap-2">
            <input
              type="number"
              value={newThreshold}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleUpdateThreshold}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
            >
              Save
            </button>
          </div>
        </div>

        {/* Control 2: Lift Fraud Quarantine */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Quarantine Override
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={quarantineInput}
              onChange={(e) => setQuarantineInput(e.target.value)}
              placeholder="IP or User ID"
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleLiftQuarantine}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
            >
              Unfreeze
            </button>
          </div>
        </div>

        {/* Control 3: Multi-Currency FX Sync */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Multi-Currency FX Engine
          </h4>
          <button
            onClick={handleSyncFx}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            Sync FX Rates Across 7 Currencies
          </button>
        </div>
      </div>
    </div>
  );
};
