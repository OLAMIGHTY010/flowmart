import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  Check,
  Share2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ShoppingBag,
  Store,
  MapPin,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  DollarSign,
  UtensilsCrossed,
  Send
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { audioChimes } from "@/utils/audioChimes";

interface GroupMember {
  id: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
  avatarColor: string;
  joinedAt: string;
  lastActiveAt: string;
}

interface GroupItem {
  id: string;
  guestName: string;
  guestId?: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
  instructions?: string;
  addedAt?: string;
}

interface GroupSession {
  code: string;
  hostId: string;
  hostName: string;
  restaurantId?: string;
  restaurantName?: string;
  items: GroupItem[];
  members: GroupMember[];
  isLocked: boolean;
  spendingLimitPerPersonNgn?: number;
  paymentMode: "HOST_PAYS_ALL" | "SPLIT_BILL";
  deliveryAddress?: string;
  createdAt: string;
  expiresAt: string;
}

const MENU_CATALOG = [
  {
    id: "prod-jollof",
    name: "Smokey Party Jollof Rice Special",
    price: 3200,
    category: "Mains",
    imageUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80",
    description: "Classic firewood smoky jollof rice served with spiced plantain."
  },
  {
    id: "prod-chicken",
    name: "Crispy Southern Fried Chicken",
    price: 2600,
    category: "Proteins",
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80",
    description: "Golden crispy fried chicken thigh with secret southern batter."
  },
  {
    id: "prod-dodo",
    name: "Sweet Golden Fried Plantain (Dodo)",
    price: 1400,
    category: "Sides",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    description: "Sweet ripe plantain slices fried to caramelized perfection."
  },
  {
    id: "prod-shawarma",
    name: "Jumbo Double Beef Shawarma",
    price: 3800,
    category: "Street Eats",
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&auto=format&fit=crop&q=80",
    description: "Warm pita wrapped with tender spiced beef and creamy garlic drizzle."
  },
  {
    id: "prod-pizza",
    name: "Artisan Double Pepperoni Pizza",
    price: 5200,
    category: "Mains",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    description: "Stonebaked pizza with melted mozzarella and beef pepperoni."
  },
  {
    id: "prod-chapman",
    name: "Signature Chilled Chapman Mocktail",
    price: 1800,
    category: "Beverages",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    description: "Refreshing Nigerian Chapman with fresh cucumber, lemon, and aromatic bitters."
  }
];

export default function GroupOrderRoom() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const addToCartCustomized = useCartStore((s) => s.addToCartCustomized);

  const roomCode = paramCode || "FLOW-2026";
  const [session, setSession] = useState<GroupSession | null>(null);
  const [activeTab, setActiveTab] = useState<"CART" | "MENU">("CART");
  const [currentGuestName, setCurrentGuestName] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimitNgn, setNewLimitNgn] = useState<number>(6000);
  const [isTransferringCheckout, setIsTransferringCheckout] = useState(false);

  // Poll for live room changes every 3.5 seconds
  useEffect(() => {
    fetchRoomSession();
    const interval = setInterval(fetchRoomSession, 3500);
    return () => clearInterval(interval);
  }, [roomCode]);

  useEffect(() => {
    if (user?.fullName) {
      setCurrentGuestName(user.fullName);
    } else if (!currentGuestName) {
      setCurrentGuestName("Friend " + Math.floor(10 + Math.random() * 90));
    }
  }, [user]);

  const fetchRoomSession = async () => {
    try {
      const res: any = await apiClient.get(`/cart/group/${roomCode}`);
      if (res.success && res.session) {
        setSession(res.session);
        setNewLimitNgn(res.session.spendingLimitPerPersonNgn || 6000);
      }
    } catch (err) {
      console.error("Failed to fetch group room session:", err);
    }
  };

  const isHost = user?.id === session?.hostId || session?.hostName === currentGuestName;

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/group-order/${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast("Group Order Room link copied! Share with your friends.", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const inviteUrl = `${window.location.origin}/group-order/${roomCode}`;
    const text = `Join my FlowMart Group Order for ${session?.restaurantName || "our food order"}! Add what you want here: ${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleToggleLock = async () => {
    if (!session) return;
    try {
      const res: any = await apiClient.post(`/cart/group/${roomCode}/lock`);
      if (res.success) {
        setSession({ ...session, isLocked: !session.isLocked });
        showToast(session.isLocked ? "Cart unlocked for additions." : "Cart locked by host.", "info");
      }
    } catch (err) {
      showToast("Could not update lock status", "error");
    }
  };

  const handleSaveSettings = async () => {
    if (!session) return;
    try {
      const res: any = await apiClient.post(`/cart/group/${roomCode}/settings`, {
        spendingLimitPerPersonNgn: newLimitNgn,
        paymentMode: session.paymentMode
      });
      if (res.success) {
        setSession({ ...session, spendingLimitPerPersonNgn: newLimitNgn });
        setIsEditingLimit(false);
        showToast(`Updated per-person limit to ₦${newLimitNgn.toLocaleString()}`, "success");
      }
    } catch (err) {
      showToast("Failed to save settings", "error");
    }
  };

  const handleTogglePaymentMode = async (mode: "HOST_PAYS_ALL" | "SPLIT_BILL") => {
    if (!session) return;
    try {
      const res: any = await apiClient.post(`/cart/group/${roomCode}/settings`, {
        paymentMode: mode
      });
      if (res.success) {
        setSession({ ...session, paymentMode: mode });
        showToast(
          mode === "HOST_PAYS_ALL"
            ? "Host will pay for the entire group order."
            : "Bill will be split equally among participants at checkout.",
          "info"
        );
      }
    } catch (err) {
      showToast("Failed to update payment mode", "error");
    }
  };

  const handleAddItemToRoom = async (menuItem: typeof MENU_CATALOG[0]) => {
    if (!session) return;
    if (session.isLocked) {
      showToast("The host has locked this group cart for checkout.", "error");
      return;
    }

    const guestName = currentGuestName.trim() || "Guest";

    // Optimistic item
    const newItem: GroupItem = {
      id: `gitem-${Date.now()}`,
      guestName,
      productId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      qty: 1,
      imageUrl: menuItem.imageUrl,
      instructions: "Standard Pack",
      addedAt: new Date().toISOString()
    };

    setSession({
      ...session,
      items: [...session.items, newItem]
    });

    audioChimes.orderPlaced();
    showToast(`Added ${menuItem.name} for ${guestName}!`, "success");

    try {
      await apiClient.post(`/cart/group/${roomCode}/items`, {
        guestName,
        productId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1,
        imageUrl: menuItem.imageUrl
      });
    } catch (err) {
      console.error("Failed to add item to backend group cart:", err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!session) return;
    if (session.isLocked) {
      showToast("The cart is locked for checkout.", "error");
      return;
    }

    setSession({
      ...session,
      items: session.items.filter((i) => i.id !== itemId)
    });

    try {
      await apiClient.delete(`/cart/group/${roomCode}/items/${itemId}`);
      showToast("Item removed from group cart.", "info");
    } catch (err) {
      console.error("Failed to delete item from backend:", err);
    }
  };

  // Host Proceed to Checkout
  const handleHostCheckout = async () => {
    if (!session || session.items.length === 0) {
      showToast("No items in the group cart to checkout.", "error");
      return;
    }

    setIsTransferringCheckout(true);

    try {
      const res: any = await apiClient.post(`/cart/group/${roomCode}/checkout-payload`);

      if (res.success && res.data) {
        // Ingest items into useCartStore
        res.data.items.forEach((it: any) => {
          addToCartCustomized({
            product: {
              id: it.id,
              name: it.name,
              price: it.price,
              imageUrl: it.imageUrl,
              stockQuantity: 99,
              sku: it.sku,
              description: it.specialInstructions,
              productType: "food"
            },
            quantity: it.quantity,
            specialInstructions: it.specialInstructions,
            unitPriceWithModifiers: it.price
          });
        });

        audioChimes.orderDelivered();
        showToast("✨ Group Order transferred to checkout!", "success");

        if (session.paymentMode === "SPLIT_BILL") {
          navigate(`/split-bill/${roomCode}`);
        } else {
          navigate("/checkout");
        }
      }
    } catch (err) {
      console.error("Checkout transfer error:", err);
      showToast("Failed to transfer cart to checkout", "error");
    } finally {
      setIsTransferringCheckout(false);
    }
  };

  // Financial Calculations
  const items = session?.items || [];
  const subtotalNgn = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const deliveryFeeNgn = 850;
  const serviceFeeNgn = 250;
  const grandTotalNgn = subtotalNgn + deliveryFeeNgn + serviceFeeNgn;

  // Group items by participant
  const itemsByMember: Record<string, GroupItem[]> = {};
  items.forEach((it) => {
    if (!itemsByMember[it.guestName]) itemsByMember[it.guestName] = [];
    itemsByMember[it.guestName].push(it);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-20">
      {/* ── TOP HERO ROOM BANNER ── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                Live Group Room
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 bg-slate-950 px-3 py-0.5 rounded-xl border border-slate-800">
                {roomCode}
              </span>
              {session?.isLocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <Lock size={12} /> Locked for Checkout
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Unlock size={12} /> Open for Additions
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {session?.restaurantName || "Chicken Republic Express"}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
              <span className="flex items-center gap-1.5">
                <Store size={14} className="text-indigo-400" />
                Host: <strong>{session?.hostName || "Babatunde Adeyemi"}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-indigo-400" />
                {session?.deliveryAddress || "14B Admiralty Way, Lekki Phase 1, Lagos"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" />
                ⚡ 25-35 min delivery
              </span>
            </div>
          </div>

          {/* Room Share & Invite Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyInviteLink}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copiedLink ? "Link Copied!" : "Copy Invite"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Share2 size={16} />
              <span>Share WhatsApp</span>
            </button>

            {isHost && (
              <button
                onClick={handleToggleLock}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border ${
                  session?.isLocked
                    ? "bg-amber-600/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-600/20 text-rose-300 border-rose-500/40"
                }`}
              >
                {session?.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                <span>{session?.isLocked ? "Unlock Cart" : "Lock Cart"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Members Presence Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              Connected Members in Room ({session?.members.length || 3})
            </span>

            {/* Spending Limit Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Per-Person Budget Limit:</span>
              {isEditingLimit ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={newLimitNgn}
                    onChange={(e) => setNewLimitNgn(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-slate-950 border border-indigo-500 rounded text-xs text-white"
                  />
                  <button
                    onClick={handleSaveSettings}
                    className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  ₦{session?.spendingLimitPerPersonNgn?.toLocaleString() || "6,000"}
                  {isHost && (
                    <button
                      onClick={() => setIsEditingLimit(true)}
                      className="text-[10px] text-slate-400 underline hover:text-white ml-1"
                    >
                      (Edit)
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Member Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {session?.members.map((member) => {
              const memberSpent = (itemsByMember[member.name] || []).reduce(
                (sum, it) => sum + it.price * it.qty,
                0
              );
              const limit = session.spendingLimitPerPersonNgn || 6000;
              const isOverLimit = memberSpent > limit;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs transition-all ${
                    isOverLimit
                      ? "bg-rose-950/40 border-rose-500 text-rose-300"
                      : "bg-slate-900 border-slate-700/80 text-white"
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white relative flex-shrink-0"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0)}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                  </div>
                  <span className="font-semibold">{member.name}</span>
                  {member.isHost && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      Host
                    </span>
                  )}
                  <span className="font-bold text-slate-300">
                    ₦{memberSpent.toLocaleString()}
                  </span>
                  {isOverLimit && (
                    <span
                      title="Exceeds per-person limit"
                      className="text-rose-400"
                    >
                      ⚠️
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROOM CONTROLS: MY NAME + TAB SELECTOR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Ordering as:</span>
          <input
            type="text"
            value={currentGuestName}
            onChange={(e) => setCurrentGuestName(e.target.value)}
            placeholder="Your Name (e.g. Tunde)"
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("CART")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "CART"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={14} />
            Group Cart ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("MENU")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "MENU"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed size={14} />
            Browse Restaurant Menu
          </button>
        </div>
      </div>

      {/* ── TAB 1: GROUP CART CONTENT ── */}
      {activeTab === "CART" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Group Items categorized by Member */}
          <div className="lg:col-span-2 space-y-6">
            {Object.keys(itemsByMember).length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 space-y-3">
                <ShoppingBag size={36} className="mx-auto text-slate-600" />
                <h4 className="text-base font-bold text-white">Group Cart is Empty</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Browse the menu tab above or share the room link so your friends can pick their meals.
                </p>
                <button
                  onClick={() => setActiveTab("MENU")}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Browse Menu & Add Dishes
                </button>
              </div>
            ) : (
              Object.entries(itemsByMember).map(([memberName, memberItems]) => {
                const memberTotal = memberItems.reduce(
                  (sum, it) => sum + it.price * it.qty,
                  0
                );
                const limit = session?.spendingLimitPerPersonNgn || 6000;
                const isOver = memberTotal > limit;

                return (
                  <div
                    key={memberName}
                    className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                          {memberName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{memberName}</h4>
                          <span className="text-[11px] text-slate-400">
                            {memberItems.length} {memberItems.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-white">
                          ₦{memberTotal.toLocaleString()}
                        </span>
                        {isOver && (
                          <span className="block text-[10px] font-bold text-rose-400">
                            Exceeds ₦{limit.toLocaleString()} Limit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Member Dish Line Items */}
                    <div className="space-y-2.5">
                      {memberItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">
                                {item.name}
                              </h5>
                              {item.instructions && (
                                <p className="text-[11px] text-slate-400 italic">
                                  Note: {item.instructions}
                                </p>
                              )}
                              <span className="text-xs font-bold text-indigo-400">
                                ₦{item.price.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {(isHost || item.guestName === currentGuestName) && (
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Checkout Summary & Host Payment Mode */}
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="font-bold text-base text-white">Group Order Summary</h4>

              {/* Payment Mode Selector (Host only) */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Payment Arrangement:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTogglePaymentMode("HOST_PAYS_ALL")}
                    disabled={!isHost}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left ${
                      session?.paymentMode === "HOST_PAYS_ALL"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    👑 Host Pays All
                  </button>
                  <button
                    onClick={() => handleTogglePaymentMode("SPLIT_BILL")}
                    disabled={!isHost}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left ${
                      session?.paymentMode === "SPLIT_BILL"
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    ⚖️ Split Equally
                  </button>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Food Subtotal ({items.length} items):</span>
                  <span className="text-white font-medium">₦{subtotalNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="text-white font-medium">₦{deliveryFeeNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Packaging & Service:</span>
                  <span className="text-white font-medium">₦{serviceFeeNgn.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Total Group Bill:</span>
                  <span className="text-xl text-amber-400 font-black">
                    ₦{grandTotalNgn.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Trigger */}
              {isHost ? (
                <button
                  onClick={handleHostCheckout}
                  disabled={isTransferringCheckout || items.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag size={18} />
                  {isTransferringCheckout
                    ? "Locking & Transferring..."
                    : `Lock & Checkout (₦${grandTotalNgn.toLocaleString()})`}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> Ready in Room
                  </span>
                  <p>Awaiting host ({session?.hostName}) to lock and place the group checkout.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: IN-ROOM RESTAURANT MENU BROWSER ── */}
      {activeTab === "MENU" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Store size={18} className="text-indigo-400" />
              Menu from {session?.restaurantName || "Chicken Republic Express"}
            </h3>
            <span className="text-xs text-slate-400">
              Click "+ Add" to put dish in group cart as <strong>{currentGuestName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MENU_CATALOG.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-36 rounded-2xl object-cover mb-3"
                  />
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {item.category}
                    </span>
                    <span className="text-xs font-black text-white">
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <button
                  onClick={() => handleAddItemToRoom(item)}
                  disabled={session?.isLocked}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={15} />
                  Add to Group Cart (for {currentGuestName.split(" ")[0]})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
