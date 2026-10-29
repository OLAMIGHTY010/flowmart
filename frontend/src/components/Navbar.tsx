import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingCart, User, Menu, X, MapPin, ChevronDown, Crown } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import logo from "@/assets/logo.png";
import { DeliveryAddressModal } from "@/components/navigation/DeliveryAddressModal";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const cartCount = useCartStore((s) => s.getCartCount());

  // Active delivery address state
  const [currentAddress, setCurrentAddress] = useState(() => {
    try {
      const raw = localStorage.getItem("flowmart_active_address");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.street || "Admiralty Way, Lekki";
      }
    } catch {}
    return "Admiralty Way, Lekki Phase 1";
  });

  const [isFlowPass, setIsFlowPass] = useState(() => {
    try {
      return localStorage.getItem("flowmart_flowpass_active") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleAddressChange = (e: any) => {
      if (e?.detail?.street) {
        setCurrentAddress(e.detail.street);
      }
    };
    window.addEventListener("flowmart:addressChanged", handleAddressChange);
    return () => window.removeEventListener("flowmart:addressChanged", handleAddressChange);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Sticky Delivery Location Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src={logo} 
              alt="FlowMart Logo" 
              className="w-9 h-9 object-contain rounded"
            />
            <span className="text-lg font-extrabold text-indigo-400 tracking-tight hidden sm:block">
              Flow<span className="text-white">Mart</span>
            </span>
          </Link>

          {/* Chowdeck-Style Delivery Location Switcher Pill */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-left transition shrink-0 cursor-pointer shadow-sm"
            title="Change Delivery Location"
          >
            <MapPin size={14} className="text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 leading-tight">
                Deliver to
              </span>
              <span className="text-xs font-bold text-slate-100 max-w-[120px] sm:max-w-[170px] truncate leading-tight">
                {currentAddress}
              </span>
            </div>
            <ChevronDown size={13} className="text-slate-400 shrink-0 ml-0.5" />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex gap-6 items-center ml-2 mr-auto">
          <Link to="/" className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors">Home</Link>
          <Link to="/products" className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors">Marketplace</Link>
          <Link to="/food" className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors">Food</Link>
          <Link to="/orders" className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors">Orders</Link>
        </div>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
          <div className="flex items-center w-full bg-slate-800/80 border border-slate-700 rounded-full pr-1 pl-4 h-10 overflow-hidden focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              placeholder="Search dishes, groceries, stores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-xs text-slate-100 bg-transparent placeholder-slate-400"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Search size={15} className="text-white" />
            </button>
          </div>
        </form>

        {/* Right Actions: FlowPass Badge, Cart, Profile */}
        <div className="flex items-center gap-2">
          {/* FlowPass VIP Badge */}
          {isFlowPass && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-900/60 to-violet-900/60 border border-indigo-500/30 text-[11px] font-bold text-amber-300">
              <Crown size={13} className="text-amber-400" />
              <span>FlowPass</span>
            </div>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors relative"
            title="Cart"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* User / Login */}
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center text-white text-sm font-semibold shadow-sm cursor-pointer"
              >
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </button>
              <button
                onClick={() => logout()}
                className="hidden md:block px-4 py-1.5 bg-transparent text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-full pr-1 pl-3.5 h-9">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search meals, restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-xs text-slate-100 bg-transparent px-2.5 placeholder-slate-400"
            />
          </div>
        </form>
      </div>

      {/* Delivery Address Modal */}
      <DeliveryAddressModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onAddressSelect={(addr) => setCurrentAddress(addr.street)}
      />
    </nav>
  );
};

export default Navbar;
