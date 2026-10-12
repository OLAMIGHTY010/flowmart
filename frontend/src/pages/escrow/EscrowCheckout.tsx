import { useState } from "react";
import { ShieldCheck, Info, Lock, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EscrowCheckout() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLockFunds = () => {
    setLoading(true);
    // Simulate API call to /escrow/initiate
    setTimeout(() => {
      setLoading(false);
      navigate("/escrow/manage");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">Secure Escrow Checkout</h1>
          <p className="text-blue-100 text-sm">Your funds are held safely until you inspect the property.</p>
        </div>

        <div className="p-8">
          
          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Transaction Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Item</span>
                <span className="font-semibold text-gray-900">Luxury 4 Bed Detached Duplex</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seller</span>
                <span className="font-semibold text-gray-900">Real Estate Pros Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agreed Price</span>
                <span className="font-black text-blue-700">₦250,000,000</span>
              </div>
            </div>
          </div>

          {/* Escrow Terms */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-4 items-start">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600 flex-shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">100% Protection</h4>
                <p className="text-xs text-gray-500 mt-1">Your money is held in FlowMart's secure escrow. The seller cannot access it until you explicitly release it.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-amber-50 p-2 rounded-xl text-amber-600 flex-shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">7-Day Inspection Period</h4>
                <p className="text-xs text-gray-500 mt-1">You have 7 days to inspect the property. If you do not release funds or raise a dispute within 7 days, funds will auto-release.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-gray-50 p-2 rounded-xl text-gray-600 flex-shrink-0">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">No Buyer Fees</h4>
                <p className="text-xs text-gray-500 mt-1">The escrow protection fee is paid entirely by the seller. You only pay the agreed property price.</p>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl mb-8 border border-gray-100 hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-sm text-gray-700 font-medium">
              I understand that I am locking ₦250,000,000 into FlowMart Escrow. I agree to the 7-day inspection timeout policy.
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-4">
            <button 
              className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              disabled={!agreed || loading}
              onClick={handleLockFunds}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Locking Funds..." : <><Lock className="h-4 w-4" /> Lock Funds Now</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
