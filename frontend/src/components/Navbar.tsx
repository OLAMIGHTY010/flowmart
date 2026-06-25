import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = useCartStore((s) => s.getCartCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-slate-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-5">
        {/* Logo */}
        <Link to="/products" className="flex items-center gap-2 shrink-0">
          <img 
            src={logo} 
            alt="FlowMart Logo" 
            className="w-9 h-9 object-contain rounded"
          />
          <span className="text-lg font-extrabold text-green-400 tracking-tight hidden sm:block">
            Flow<span className="text-white">Mart</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex gap-6 items-center ml-6 mr-auto">
          <Link to="/" className="text-sm font-semibold text-white hover:text-green-400 transition-colors">Home</Link>
          <Link to="/products" className="text-sm font-semibold text-white hover:text-green-400 transition-colors">Products</Link>
          <Link to="/orders" className="text-sm font-semibold text-white hover:text-green-400 transition-colors">Orders</Link>
        </div>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
          <div className="flex items-center w-full bg-white rounded-full pr-1 pl-4 h-10 overflow-hidden">
            <input
              type="text"
              placeholder="Search products, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-sm text-gray-900 bg-transparent"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center shrink-0"
            >
              <Search size={16} className="text-white" />
            </button>
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link
            to="/cart"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors relative"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* User / Login */}
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 transition-colors flex items-center justify-center text-white text-sm font-semibold"
              >
                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
              </button>
              <button
                onClick={() => logout()}
                className="hidden md:block px-5 py-2 bg-transparent text-gray-300 border border-gray-600 hover:border-gray-400 rounded-full text-sm font-semibold transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:block px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="flex items-center bg-white rounded-full pr-1 pl-3.5 h-10">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-[13px] text-gray-900 bg-transparent px-2.5"
            />
          </div>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
