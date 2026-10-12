import React, { useEffect, useState } from 'react';
import { Navigation, Clock, Zap, Check, X, ShieldAlert } from 'lucide-react';
import { automationServices } from '../../services/AutomationServices';

interface Props {
  riderId?: string;
  onAccepted?: (orderId: string) => void;
}

export const RiderAutonomousOfferModal: React.FC<Props> = ({ riderId = 'rider-lagos-01', onAccepted }) => {
  const [offer, setOffer] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(45);
  const [loading, setLoading] = useState<boolean>(false);

  const checkOffer = async () => {
    try {
      const res = await automationServices.getRiderActiveOffer(riderId);
      if (res?.offer?.hasOffer) {
        setOffer(res.offer);
        setCountdown(res.offer.remainingSeconds || 45);
      } else {
        setOffer(null);
      }
    } catch (err) {
      // Quiet fail if offline
    }
  };

  useEffect(() => {
    checkOffer();
    const interval = setInterval(checkOffer, 5000);
    return () => clearInterval(interval);
  }, [riderId]);

  useEffect(() => {
    if (!offer || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setOffer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [offer, countdown]);

  const handleResponse = async (response: 'ACCEPT' | 'DECLINE') => {
    if (!offer?.dispatchId) return;
    setLoading(true);
    try {
      await automationServices.respondToRiderOffer(offer.dispatchId, riderId, response);
      if (response === 'ACCEPT' && onAccepted) {
        onAccepted(offer.orderId);
      }
      setOffer(null);
    } catch (err) {
      console.error('Failed to respond to offer', err);
    } finally {
      setLoading(false);
    }
  };

  if (!offer) return null;

  const progressPercent = Math.max(0, (countdown / 45) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-white relative overflow-hidden">
        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5 animate-bounce" />
            </span>
            <div>
              <h3 className="font-bold text-lg text-white">Autonomous Dispatch Offer</h3>
              <p className="text-xs text-amber-400/90 font-medium">Auto-cascades to next rider on expiry</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 font-mono font-bold text-sm">
            <Clock className="w-4 h-4 animate-spin" />
            {countdown}s
          </div>
        </div>

        {/* Dispatch Order Details */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Order #{offer.orderId?.slice(0, 8)}</span>
            {offer.surgeMultiplier > 1.0 && (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-bold">
                {offer.surgeMultiplier}x Weather Surge Applied
              </span>
            )}
          </div>

          <div className="flex items-start gap-3">
            <Navigation className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Pickup: Lekki Phase 1 Hub</p>
              <p className="text-xs text-slate-400">Dropoff: Victoria Island, Lagos</p>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-400">Estimated Delivery Earnings</span>
            <span className="text-lg font-bold text-emerald-400">
              ₦{Math.round(3500 * (offer.surgeMultiplier || 1.0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleResponse('DECLINE')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={() => handleResponse('ACCEPT')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            Accept ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
};
