import React, { useState, useEffect } from "react";
import { Users, Copy, Check, Share2, Lock, ShoppingBag, Plus, X, AlertCircle } from "lucide-react";
import { apiClient } from "@/services/api";
import { useCartStore } from "@/stores/cartStore";

interface GroupItem {
  id: string;
  guestName: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  modifiers?: { groupName: string; optionName: string; price: number }[];
  instructions?: string;
}

interface GroupSession {
  code: string;
  hostId: string;
  hostName: string;
  items: GroupItem[];
  isLocked: boolean;
  createdAt: string;
  expiresAt: string;
}

interface GroupOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionCode?: string;
  onSessionLocked?: (items: GroupItem[]) => void;
}

export const GroupOrderModal: React.FC<GroupOrderModalProps> = ({
  isOpen,
  onClose,
  activeSessionCode,
  onSessionLocked,
}) => {
  const [session, setSession] = useState<GroupSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [guestNameInput, setGuestNameInput] = useState("");
  const [quickMealName, setQuickMealName] = useState("");
  const [quickMealPrice, setQuickMealPrice] = useState("2500");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addToCart = useCartStore((s) => s.addToCart);

  // Poll active session every 4 seconds when open
  useEffect(() => {
    if (!isOpen) return;
    const code = activeSessionCode || session?.code;
    if (!code) return;

    fetchSession(code);
    const interval = setInterval(() => {
      fetchSession(code);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activeSessionCode, session?.code]);

  if (!isOpen) return null;

  const fetchSession = async (code: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; session: GroupSession }>(
        `/cart/group/${code}`
      );
      if (res.success && res.session) {
        setSession(res.session);
      }
    } catch (err: any) {
      console.warn("Could not poll group cart:", err);
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{ success: boolean; session: GroupSession }>(
        "/cart/group/create",
        {}
      );
      if (res.success && res.session) {
        setSession(res.session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start group order session");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const code = joinCodeInput.trim().toUpperCase();
      const res = await apiClient.get<{ success: boolean; session: GroupSession }>(
        `/cart/group/${code}`
      );
      if (res.success && res.session) {
        setSession(res.session);
      } else {
        setErrorMsg("Session not found or expired");
      }
    } catch (err: any) {
      setErrorMsg("Invalid group code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuestItem = async () => {
    if (!session) return;
    if (!guestNameInput.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!quickMealName.trim()) {
      setErrorMsg("Please enter meal description");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post<{ success: boolean; item: GroupItem; session: GroupSession }>(
        `/cart/group/${session.code}/items`,
        {
          guestName: guestNameInput.trim(),
          productId: `prod-${Date.now()}`,
          name: quickMealName.trim(),
          price: Number(quickMealPrice) || 2500,
          qty: 1,
        }
      );
      if (res.success) {
        setSession(res.session);
        setQuickMealName("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not add item to group");
    } finally {
      setLoading(false);
    }
  };

  const handleLockAndImport = async () => {
    if (!session) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.post(`/cart/group/${session.code}/lock`, {});
      // Add each item to host's active cart store
      session.items.forEach((item) => {
        addToCart(
          {
            id: item.productId || item.id,
            name: `${item.name} (${item.guestName})`,
            price: item.price,
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
            category: "Group Order",
          } as any,
          item.qty
        );
      });

      if (onSessionLocked) {
        onSessionLocked(session.items);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to lock group order");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = typeof window !== "undefined" && session ? `${window.location.origin}/cart?group=${session.code}` : "";

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!session) return;
    const text = encodeURIComponent(
      `Hey! I'm ordering food on FlowMart. Join my group cart to add what you want:\n${shareUrl}\nGroup Code: ${session.code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                Order with Friends
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Chowdeck Live
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                One shared cart. Everyone picks their food. One delivery fee.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!session ? (
            /* Session Selection View */
            <div className="space-y-6">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 text-center">
                <Users size={32} className="text-indigo-600 mx-auto mb-2" />
                <h3 className="font-extrabold text-gray-900 text-sm mb-1">
                  Are you hosting or joining friends?
                </h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Start a fresh group cart to invite your team or enter a 4-digit code from your host.
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating Session..." : "Start New Group Cart (Be the Host)"}
                </button>
              </div>

              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <span className="relative bg-white px-3 text-xs font-bold uppercase text-gray-400">
                  Or Join Existing Cart
                </span>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-extrabold text-gray-700 block">
                  Enter Group Code (e.g. FLOW-4821)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="FLOW-XXXX"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={loading || !joinCodeInput.trim()}
                    className="px-5 py-2.5 rounded-xl font-extrabold text-sm bg-gray-900 text-white hover:bg-black transition cursor-pointer disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Group Session View */
            <div className="space-y-5">
              {/* Group Code Banner */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                    Group Share Code
                  </span>
                  <div className="text-2xl font-black text-indigo-950 tracking-wider">
                    {session.code}
                  </div>
                  <span className="text-[11px] text-indigo-700/80 font-semibold">
                    Host: {session.hostName}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition cursor-pointer"
                    title="Share to WhatsApp"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Items in Group Cart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Group Items ({session.items.length})
                  </span>
                  <span className="text-xs font-black text-indigo-600">
                    Total: ₦
                    {session.items
                      .reduce((sum, it) => sum + it.price * it.qty, 0)
                      .toLocaleString()}
                  </span>
                </div>

                {session.items.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                    <ShoppingBag size={28} className="text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-gray-500">
                      No meals added yet. Share the link so friends can choose!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {session.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              {it.guestName}
                            </span>
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {it.name}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-gray-900">
                          ₦{(it.price * it.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Meal as Guest or Member */}
              {!session.isLocked && (
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                  <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <Plus size={14} className="text-indigo-600" />
                    Add a Meal for Someone
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Friend's Name (e.g. Alex)"
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Price (₦)"
                      value={quickMealPrice}
                      onChange={(e) => setQuickMealPrice(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Meal name (e.g. Spicy Jollof + Chicken)"
                      value={quickMealName}
                      onChange={(e) => setQuickMealName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleAddGuestItem}
                      disabled={loading || !quickMealName.trim() || !guestNameInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {session && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            <button
              onClick={() => {
                setSession(null);
                setErrorMsg(null);
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              Switch Session
            </button>
            <button
              onClick={handleLockAndImport}
              disabled={loading || session.items.length === 0}
              className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Lock size={15} />
              <span>Lock Group Cart & Proceed to Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
