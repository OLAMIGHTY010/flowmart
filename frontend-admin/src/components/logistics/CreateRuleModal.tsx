import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://flowmart-backend-2s2d-o0ljo79px-gbotemiojos-projects.vercel.app/api/v1";

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zones?: any[];
}

export default function CreateRuleModal({ isOpen, onClose, onSuccess, zones = [] }: CreateRuleModalProps) {
  const [ruleType, setRuleType] = useState('surge');
  const [zoneId, setZoneId] = useState('global');
  
  // Dynamic Condition States
  const [conditionTrigger, setConditionTrigger] = useState('time');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState('rain');
  
  const [valueType, setValueType] = useState('percentage');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('10');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Construct Condition JSON dynamically
    let conditionObj: any = { trigger: conditionTrigger };
    if (conditionTrigger === 'time') {
      if (!startTime || !endTime) {
        setError("Start time and End time are required for time-based rules.");
        setLoading(false);
        return;
      }
      conditionObj.startTime = startTime;
      conditionObj.endTime = endTime;
    } else if (conditionTrigger === 'event') {
      conditionObj.eventType = eventType;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/logistics/rules`, 
        { 
          ruleType, 
          zoneId: zoneId === 'global' ? null : zoneId,
          condition: conditionObj, 
          valueType, 
          value: Number(value), 
          priority: Number(priority),
          active: true 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      setRuleType('surge');
      setConditionTrigger('time');
      setStartTime('');
      setEndTime('');
      setZoneId('global');
      setValueType('percentage');
      setValue('');
      setPriority('10');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Create Pricing Rule</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Zone</label>
              <select 
                value={zoneId}
                onChange={e => setZoneId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
              >
                <option value="global">Global (All Zones)</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.zoneName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rule Type</label>
                <select 
                  value={ruleType}
                  onChange={e => setRuleType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                >
                  <option value="surge">Surge Pricing</option>
                  <option value="discount">Discount</option>
                  <option value="base_modifier">Base Modifier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority (Higher = First)</label>
                <input 
                  type="number" 
                  required
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Condition Builder */}
            <div className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Trigger Condition</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Type</label>
                <select 
                  value={conditionTrigger}
                  onChange={e => setConditionTrigger(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                >
                  <option value="time">Time Based (e.g. Night Surge)</option>
                  <option value="event">Event Based (e.g. Rain, Traffic)</option>
                </select>
              </div>

              {conditionTrigger === 'time' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                    />
                  </div>
                </div>
              )}

              {conditionTrigger === 'event' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event/Weather</label>
                  <select 
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  >
                    <option value="rain">Heavy Rain</option>
                    <option value="traffic">Heavy Traffic</option>
                    <option value="holiday">Public Holiday</option>
                    <option value="peak_demand">Peak Demand</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type</label>
                <select 
                  value={valueType}
                  onChange={e => setValueType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₦)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Value</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                  placeholder={valueType === 'percentage' ? "e.g. 50 (for 50%)" : "e.g. 1000"}
                />
              </div>
            </div>

          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-sm font-bold text-white bg-[#0ca948] hover:bg-[#0a8c3c] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
