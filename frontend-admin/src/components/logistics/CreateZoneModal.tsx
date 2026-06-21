import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateZoneModal({ isOpen, onClose, onSuccess }: CreateZoneModalProps) {
  const [zoneName, setZoneName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/logistics/zones`, 
        { zoneName, active: true }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
      setZoneName('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Create Delivery Zone</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Zone Name</label>
              <input 
                type="text" 
                required
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
                placeholder="e.g. Lagos Mainland"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4">Pricing for this zone will be set to zero by default. The Finance team will assign pricing values.</p>

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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
