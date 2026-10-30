import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, X, ArrowRight, Sparkles, Check, Share2, Copy } from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  restaurantName?: string;
  deliveryAddress?: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number }>;
}

export function SplitBillModal({
  isOpen,
  onClose,
  totalAmount,
  restaurantName = "FlowMart Restaurant",
  deliveryAddress = "Lagos, Nigeria",
  items = []
}: SplitBillModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [numPeople, setNumPeople] = useState<number>(3);
  const [hostName, setHostName] = useState<string>("Me (Host)");
  const [friendNames, setFriendNames] = useState<string[]>(["Friend 1", "Friend 2"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNumChange = (n: number) => {
    setNumPeople(n);
    const newFriends = Array.from({ length: n - 1 }, (_, i) => friendNames[i] || `Friend ${i + 1}`);
    setFriendNames(newFriends);
  };

  const handleFriendNameChange = (idx: number, val: string) => {
    const updated = [...friendNames];
    updated[idx] = val;
    setFriendNames(updated);
  };

  const perPersonShare = Math.round(totalAmount / Math.max(1, numPeople));

  const handleCreateSession = async () => {
    try {
      setIsSubmitting(true);
      const res = await apiClient.post("/orders/split-bill/create", {
        restaurantName,
        deliveryAddress,
        totalAmount,
        hostName,
        participantNames: friendNames,
        items
      });

      if (res.data?.success && res.data.session) {
        showToast("Split Bill session created! Share link with friends.", "success");
        onClose();
        navigate(`/split/${res.data.session.code}`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create split bill session", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150 text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Split the Bill with Friends</h3>
              <p className="text-xs text-slate-500 font-medium">Automatic dispatch when 100% funded</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Share Calculation Card */}
        <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cart Bill</span>
            <div className="text-xl font-black text-slate-900">₦{totalAmount.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Per Person Share</span>
            <div className="text-2xl font-black text-indigo-600">₦{perPersonShare.toLocaleString()}</div>
          </div>
        </div>

        {/* Participant Count Selector */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700">How many people are splitting?</label>
          <div className="flex items-center gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumChange(num)}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  numPeople === num 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Participant Names List */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-slate-700">Participant Names</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Your Name (Host)"
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 font-bold text-slate-900 focus:outline-none"
            />
            {friendNames.map((name, i) => (
              <input
                key={i}
                type="text"
                value={name}
                onChange={(e) => handleFriendNameChange(i, e.target.value)}
                placeholder={`Friend ${i + 1} Name`}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleCreateSession}
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isSubmitting ? "Generating Link..." : `Create Split Bill • ₦${perPersonShare.toLocaleString()} / Person`}
        </button>
      </div>
    </div>
  );
}
