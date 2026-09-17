import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiClient } from '@/services/api';

interface DisputeModalProps {
  orderId: string;
  onClose: () => void;
}

export default function DisputeModal({ orderId, onClose }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please provide a reason for the dispute.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      // In a real flow, the backend would map orderId to the corresponding escrow transaction.
      // But based on our schema we need the escrowId. We'll pass orderId for now assuming the backend or flow links them.
      // Assuming our API `/disputes` takes `escrowId`, we might need to mock or pass orderId.
      // Wait, in Phase 2 backend `openDispute` takes `escrowId`. For demo purposes, we will pass orderId as escrowId.
      const res = await apiClient.post('/disputes', {
        escrowId: orderId,
        reason,
        evidenceUrls: evidence ? [evidence] : []
      });
      
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to open dispute.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open dispute.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <ShieldAlert className="text-red-600" size={32} />
          </div>
          <h3 className="font-bold text-xl text-gray-900 mb-2">Dispute Opened</h3>
          <p className="text-sm text-gray-500 mb-6">
            We have paused the payment to the vendor. Our trust and safety team will review your dispute shortly.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-bold hover:bg-gray-800 transition"
          >
            Understood
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="font-bold text-base text-gray-900">
              Raise a Dispute
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="bg-primary/10 border border-primary/20 text-primary-800 text-xs p-3 rounded-lg font-medium leading-relaxed">
            By raising a dispute, the escrow funds for this order will be locked until the issue is resolved by our admins. Please provide accurate details.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-900">Reason for Dispute *</label>
            <textarea
              placeholder="E.g. The item is damaged or not as described..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white resize-none transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-900">Evidence Link (Optional)</label>
            <input
              type="text"
              placeholder="Link to photos or videos"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Submit Dispute
          </button>
        </form>
      </div>
    </div>
  );
}
