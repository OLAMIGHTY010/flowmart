import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

interface EditZonePricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: any | null;
}

export default function EditZonePricingModal({ isOpen, onClose, onSuccess, zone }: EditZonePricingModalProps) {
  const [baseFee, setBaseFee] = useState('');
  const [perKmFee, setPerKmFee] = useState('');
  const [riderCommissionPct, setRiderCommissionPct] = useState('');
  const [platformCommissionPct, setPlatformCommissionPct] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (zone) {
      setBaseFee(zone.baseFee?.toString() || '0');
      setPerKmFee(zone.perKmFee?.toString() || '0');
      setRiderCommissionPct(zone.riderCommissionPct?.toString() || '80');
      setPlatformCommissionPct(zone.platformCommissionPct?.toString() || '20');
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (Number(riderCommissionPct) + Number(platformCommissionPct) !== 100) {
      setError('Rider and Platform commissions must add up to exactly 100%.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      // Use PATCH to update the zone.
      await axios.patch(
        `${API_URL}/logistics/zones/${zone.id}`, 
        { 
          baseFee: Number(baseFee),
          perKmFee: Number(perKmFee),
          riderCommissionPct: Number(riderCommissionPct),
          platformCommissionPct: Number(platformCommissionPct)
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update zone pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Edit Zone Pricing</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Zone Name</p>
            <p className="font-medium text-slate-800">{zone.zoneName}</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Base Fee (₦)</label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  value={baseFee}
                  onChange={e => setBaseFee(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Per-Km Fee (₦)</label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="0"
                  value={perKmFee}
                  onChange={e => setPerKmFee(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rider Share (%)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  max="100"
                  value={riderCommissionPct}
                  onChange={e => {
                    setRiderCommissionPct(e.target.value);
                    if (e.target.value) {
                      setPlatformCommissionPct((100 - Number(e.target.value)).toString());
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Platform Share (%)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  max="100"
                  value={platformCommissionPct}
                  onChange={e => {
                    setPlatformCommissionPct(e.target.value);
                    if (e.target.value) {
                      setRiderCommissionPct((100 - Number(e.target.value)).toString());
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
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
              Save Pricing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
