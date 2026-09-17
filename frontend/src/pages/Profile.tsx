import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Bell,
  Lock,
  // MapPin,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Edit Profile", icon: User, path: "/edit-profile" },
    { label: "Notifications", icon: Bell, path: "/alerts" },
    { label: "Order History", icon: FileText, path: "/orders" },
    { label: "Privacy & Security", icon: Lock, path: "/privacy-security" },
    { label: "Help & Support", icon: HelpCircle, path: "/help-support" },
    { label: "Terms of Service", icon: FileText, path: "/terms" },
  ];

  const defaultAvatar =
    "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?w=150&h=150&fit=crop&crop=faces";

  return (
    <>
      {/* Mobile View - Preserves the exact previous layout */}
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:hidden">
        {/* Header Profile Card */}
        <div className="relative mb-8 rounded-2xl bg-green-100 p-6 pt-10 text-center border border-green-200">
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-4 text-green-800 hover:text-green-900 transition"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Avatar */}
          <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-sm">
            <img
              src={user?.avatar || defaultAvatar}
              alt={user?.fullName || "User"}
              className="h-full w-full object-cover"
            />
          </div>

          <h1 className="text-xl font-extrabold text-gray-900">
            {user?.fullName}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-green-700">
            {user?.phone} • {user?.email}
          </p>

          {user?.isVerified && (
            <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-green-700 shadow-sm">
              <ShieldCheck size={14} className="text-green-500" />
              Verified Account
            </div>
          )}
        </div>

        {/* Menu List */}
        <div className="mb-8 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex items-center justify-between rounded-xl p-4 transition hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 py-4 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:border-red-200 cursor-pointer"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

      {/* Desktop View Placeholder - Sidebar handles the menu */}
      <div className="hidden h-full flex-col items-center justify-center text-center md:flex">
        <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-4 border-gray-50 bg-gray-100 shadow-sm">
          <img
            src={user?.avatar || defaultAvatar}
            alt={user?.fullName || "User"}
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.fullName?.split(" ")[0] || "User"}!</h2>
        <p className="mt-2 max-w-md text-gray-500">
          Manage your account settings, view order history, and control your notification preferences from the sidebar menu.
        </p>
      </div>
    </>
  );
}
