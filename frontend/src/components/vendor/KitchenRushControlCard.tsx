import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Timer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

interface RushState {
  isPaused: boolean;
  pausedUntil: string | null;
  pauseReason: string | null;
  addedPrepTimeMinutes: number;
  lastUpdated: string;
}

export const KitchenRushControlCard: React.FC = () => {
  const { showToast } = useToast();
  const [rushState, setRushState] = useState<RushState>({
    isPaused: false,
    pausedUntil: null,
    pauseReason: null,
    addedPrepTimeMinutes: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [remainingTimeStr, setRemainingTimeStr] = useState<string | null>(null);

  useEffect(() => {
    fetchRushStatus();
  }, []);

  // Countdown timer when store is paused
  useEffect(() => {
    if (!rushState.isPaused || !rushState.pausedUntil) {
      setRemainingTimeStr(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(rushState.pausedUntil!).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTimeStr('Ending now...');
        fetchRushStatus();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTimeStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [rushState.isPaused, rushState.pausedUntil]);

  const fetchRushStatus = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; rushState: RushState }>('/vendor/kitchen/rush-status');
      if (res.success && res.rushState) {
        setRushState(res.rushState);
      }
    } catch {
      // Sensible defaults
    }
  };

  const handleSetPrepDelay = async (minutes: number) => {
    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; rushState: RushState; message: string }>(
        '/vendor/kitchen/rush-status',
        { addedPrepTimeMinutes: minutes }
      );
      if (res.success) {
        setRushState(res.rushState);
        showToast(
          minutes > 0
            ? `+${minutes}m prep buffer added to incoming orders`
            : 'Prep time restored to standard default',
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update prep delay', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseStore = async (durationMinutes: number) => {
    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; rushState: RushState; message: string }>(
        '/vendor/kitchen/rush-status',
        {
          isPaused: true,
          pauseDurationMinutes: durationMinutes,
          pauseReason: 'High volume kitchen rush - clearing active orders',
        }
      );
      if (res.success) {
        setRushState(res.rushState);
        showToast(`Store orders paused for ${durationMinutes} mins to clear rush`, 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to pause store', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeStore = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; rushState: RushState; message: string }>(
        '/vendor/kitchen/rush-status',
        { isPaused: false }
      );
      if (res.success) {
        setRushState(res.rushState);
        showToast('Kitchen resumed! Now accepting new customer orders', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resume store', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 shadow-sm"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
            rushState.isPaused
              ? 'bg-amber-100 text-amber-800'
              : rushState.addedPrepTimeMinutes > 0
              ? 'bg-orange-100 text-orange-700'
              : 'bg-indigo-50 text-indigo-600'
          }`}>
            {rushState.isPaused ? <PauseCircle size={22} /> : <Flame size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Kitchen Rush & Store Pause Controls
              </h2>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                rushState.isPaused
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {rushState.isPaused ? 'Taking a Breather (Paused)' : 'Kitchen Active'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Chowdeck merchant buffer controls: adjust order prep timers or temporarily pause incoming tickets during rushes
            </p>
          </div>
        </div>

        {/* Store Live Pause Toggle Button */}
        {rushState.isPaused ? (
          <button
            onClick={handleResumeStore}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <PlayCircle size={16} />
            <span>Resume Store Now</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold hidden sm:inline">Need to clear backlog?</span>
            <button
              onClick={() => handlePauseStore(30)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-black text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PauseCircle size={15} />
              <span>Pause Store (30m)</span>
            </button>
          </div>
        )}
      </div>

      {/* Paused Banner Alert */}
      {rushState.isPaused && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Hourglass size={20} className="text-amber-700 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Store is temporarily paused for kitchen rush
              </h4>
              <p className="text-xs text-amber-800 font-medium">
                New incoming orders are paused so cooks can clear active tickets without SLA penalties.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-black text-amber-900 shrink-0">
            <Timer size={14} className="text-amber-600" />
            <span>Auto-resumes in: {remainingTimeStr || 'Calculating...'}</span>
          </div>
        </div>
      )}

      {/* Prep Time Buffer Adder Chips */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-600" />
            Add Kitchen Prep Buffer to Incoming Orders
          </span>
          <span className="text-xs font-bold text-gray-500">
            Current buffer:{' '}
            <strong className="text-indigo-600 font-black">
              {rushState.addedPrepTimeMinutes > 0 ? `+${rushState.addedPrepTimeMinutes}m` : 'Standard (0m)'}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { mins: 0, label: 'Standard Prep', desc: 'Normal kitchen pace' },
            { mins: 10, label: '+10m Buffer', desc: 'Moderate lunch rush' },
            { mins: 15, label: '+15m Buffer', desc: 'Heavy evening rush' },
            { mins: 25, label: '+25m Buffer', desc: 'Peak bulk orders' },
          ].map((opt) => {
            const isSelected = rushState.addedPrepTimeMinutes === opt.mins;
            return (
              <button
                key={opt.mins}
                type="button"
                onClick={() => handleSetPrepDelay(opt.mins)}
                disabled={loading}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/20'
                    : 'bg-gray-50/70 hover:bg-gray-50 border-gray-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <CheckCircle2 size={14} className="text-indigo-600" />}
                </div>
                <span className="text-[11px] text-gray-500 font-medium">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
