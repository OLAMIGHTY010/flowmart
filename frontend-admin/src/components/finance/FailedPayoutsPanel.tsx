import { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCcw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "https://flowmart-backend-2s2d-o0ljo79px-gbotemiojos-projects.vercel.app/api/v1";

export default function FailedPayoutsPanel() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchFailedPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_URL}/finance/payouts/failed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayouts(res.data.data);
    } catch (err: any) {
      console.error("Failed to load failed payouts", err);
      setError(err.response?.data?.message || "Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedPayouts();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${API_URL}/finance/payouts/${id}/retry`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(res.data.message);
      // Remove from failed list immediately since it's now pending
      setPayouts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to retry payout.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Failed Payout Resolution</h2>
            <p className="text-sm text-slate-500">Review and retry automated transfers that were rejected by the bank.</p>
          </div>
        </div>
        <button 
          onClick={fetchFailedPayouts}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="m-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div className="overflow-x-auto w-full">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="animate-spin text-[#15803d]" size={32} />
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Failed Payouts</h3>
            <p className="text-slate-500 text-sm mt-1">All automated bank transfers are running smoothly.</p>
          </div>
        ) : (
          <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Bank Details</th>
                <th className="px-6 py-4">Failure Reason</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map(payout => (
                <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(payout.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{payout.user?.firstName} {payout.user?.lastName}</p>
                    <p className="text-xs text-slate-500 uppercase">{payout.user?.role?.replace('_', ' ')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                      ₦{Number(payout.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {payout.accountNumber ? (
                      <div>
                        <p className="text-sm font-medium text-slate-700">{payout.accountNumber}</p>
                        <p className="text-xs text-slate-500">Bank Code: {payout.bankCode}</p>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">No Bank Details</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[200px] truncate text-sm text-red-600 font-medium" title={payout.failureReason}>
                      {payout.failureReason || 'Unknown Gateway Error'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRetry(payout.id)}
                      disabled={retryingId === payout.id || (!payout.accountNumber || !payout.bankCode)}
                      className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {retryingId === payout.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCcw size={16} />
                      )}
                      Retry Transfer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
