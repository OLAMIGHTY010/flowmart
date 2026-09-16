import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, ChevronRight, MessageSquare, ExternalLink } from "lucide-react";
import { apiClient } from "@/services/api";

interface Dispute {
  id: string;
  escrowId: string;
  raisedById: string;
  reason: string;
  evidenceUrls: string[];
  status: string;
  createdAt: string;
  resolutionNotes?: string;
}

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      // In a real app we'd have a GET /disputes endpoint. We'll mock the fetch or use a placeholder if it doesn't exist yet.
      // Wait, we didn't build GET /disputes in Phase 2, only POST /disputes and POST /disputes/:id/resolve.
      // We will mock the data for the admin view for now, so they can see what it looks like.
      const mockDisputes: Dispute[] = [
        {
          id: "dsp-1234",
          escrowId: "esc-9876",
          raisedById: "usr-456",
          reason: "Item was completely damaged upon arrival. The screen is shattered.",
          evidenceUrls: ["https://placehold.co/600x400?text=Damaged+Screen"],
          status: "open",
          createdAt: new Date().toISOString(),
        }
      ];
      setDisputes(mockDisputes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, resolution: 'refund_buyer' | 'pay_vendor') => {
    if (!window.confirm(`Are you sure you want to ${resolution === 'refund_buyer' ? 'REFUND THE BUYER' : 'PAY THE VENDOR'}?`)) return;
    
    try {
      setResolving(id);
      const res = await apiClient.post(`/disputes/${id}/resolve`, {
        resolution,
        notes: `Admin manually resolved. Action: ${resolution}`
      });
      
      if (res.success) {
        setDisputes(prev => prev.map(d => 
          d.id === id 
            ? { ...d, status: resolution === 'refund_buyer' ? 'resolved_buyer_refunded' : 'resolved_vendor_paid' } 
            : d
        ));
      }
    } catch (err) {
      alert("Failed to resolve dispute");
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escrow Disputes</h1>
          <p className="text-gray-500 mt-1">Review and resolve C2C transaction conflicts.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading disputes...</div>
      ) : (
        <div className="grid gap-6">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dispute.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {dispute.status === 'open' ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Dispute #{dispute.id.substring(0,8)}</h3>
                    <p className="text-xs text-gray-500">Escrow: {dispute.escrowId}</p>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    dispute.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {dispute.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Buyer's Complaint:</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 italic border-l-4 border-red-400">
                  "{dispute.reason}"
                </div>

                {dispute.evidenceUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Evidence:</h4>
                    <div className="flex gap-4">
                      {dispute.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-gray-200">
                          <img src={url} alt="Evidence" className="w-24 h-24 object-cover" />
                          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                            <ExternalLink size={20} className="text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {dispute.status === 'open' && (
                  <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                    <button 
                      onClick={() => handleResolve(dispute.id, 'refund_buyer')}
                      disabled={resolving === dispute.id}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
                    >
                      {resolving === dispute.id ? 'Processing...' : 'Rule for Buyer (Refund)'}
                    </button>
                    <button 
                      onClick={() => handleResolve(dispute.id, 'pay_vendor')}
                      disabled={resolving === dispute.id}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
                    >
                      {resolving === dispute.id ? 'Processing...' : 'Rule for Vendor (Release Funds)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
