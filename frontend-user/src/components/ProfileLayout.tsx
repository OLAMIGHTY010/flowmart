import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Bell,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
// import Navbar from "@/components/Navbar";

export default function ProfileLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Profile Overview", icon: User, path: "/profile" },
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
    <div className="flex min-h-screen flex-col bg-gray-50 md:bg-gray-100">
      <div className="hidden md:block">
        {/* Pass dummy props or integrate correctly if AppLayout Navbar is decoupled. Let's just render the Navbar from components/Navbar */}
        {/* Actually, it's better to render Navbar inside AppLayout. We can do that by nesting ProfileLayout inside AppLayout! */}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-8 lg:px-8">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden w-72 shrink-0 flex-col gap-6 md:flex">
          {/* Profile Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full border-4 border-gray-50 bg-gray-100 shadow-sm">
              <img
                src={user?.avatar || defaultAvatar}
                alt={user?.fullName || "User"}
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="text-xl font-bold text-gray-900">
              {user?.fullName || "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.email}
            </p>

            {user?.isVerified && (
              <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700">
                <ShieldCheck size={14} className="text-green-500" />
                Verified Account
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? "text-primary" : "text-gray-400"} />
                      {item.label}
                    </div>
                    {isActive && <ChevronRight size={16} className="text-primary" />}
                  </Link>
                );
              })}
            </div>

            <div className="my-2 border-t border-gray-100" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        {/* On mobile, this takes the full width and handles its own layout. On desktop, it acts as the right-side panel. */}
        <main className="flex-1 w-full md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-8 md:shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
