import React, { useState } from 'react';
import { ShieldCheck, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { automationServices } from '../../services/AutomationServices';

interface Props {
  orderId: string;
  orderTotalNgn: number;
  onResolved?: (resolution: any) => void;
}

export const InstantMicroDisputeCard: React.FC<Props> = ({
  orderId,
  orderTotalNgn = 4500,
  onResolved,
}) => {
  const [claimReason, setClaimReason] = useState<string>('MISSING_QUANTITY');
  const [claimAmount, setClaimAmount] = useState<number>(Math.min(5000, orderTotalNgn));
  const [loading, setLoading] = useState<boolean>(false);
  const [resolution, setResolution] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await automationServices.arbitrateUserDispute({
        disputeId: `disp-user-${orderId}-${Date.now()}`,
        orderId,
        claimAmountNgn: claimAmount,
        claimReason,
        buyerTrustScore: 0.95,
      });

      if (res?.resolution) {
        setResolution(res.resolution);
        if (onResolved) onResolved(res.resolution);
      }
    } catch (err) {
      console.error('Failed to submit dispute', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
            Instant Micro-Dispute Fast-Track
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Auto-Refund &lt;₦5,000
            </span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Automated AI arbitration engine with immediate wallet settlement
          </p>
        </div>
      </div>

      {!resolution ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Reason for Claim</label>
            <select
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="MISSING_QUANTITY">Missing Item or Partial Quantity</option>
              <option value="DAMAGED_PACKAGE">Damaged Packaging / Transit Bruise</option>
              <option value="WRONG_ITEM">Incorrect Product Variant Delivered</option>
              <option value="NOT_DELIVERED">Package Not Located on Doorstep</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Claim Amount (NGN)</label>
            <input
              type="number"
              value={claimAmount}
              onChange={(e) => setClaimAmount(Number(e.target.value))}
              max={orderTotalNgn}
              className="mt-1 w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Evaluate with Autonomous Arbitration Bot
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            {resolution.resolutionType === 'AUTO_RESOLVED_MICRO'
              ? 'Instant Goodwill Refund Approved!'
              : 'Automated Arbitration Docket Compiled'}
          </div>
          <p className="text-xs text-slate-300">{resolution.rationale}</p>
          <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
            <span className="text-slate-400">Credit to Wallet:</span>
            <span className="font-bold text-emerald-400">
              ₦{resolution.buyerRefundAmountNgn?.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
