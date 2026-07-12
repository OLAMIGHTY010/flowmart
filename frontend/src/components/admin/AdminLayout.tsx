import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Store, 
  Bike, 
  LogOut, 
  ShieldCheck, 
  AlertTriangle 
} from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Vendor Approvals", path: "/admin/kyc/vendors", icon: <Store size={20} /> },
    { name: "Rider Approvals", path: "/admin/kyc/riders", icon: <Bike size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-border">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">FlowMart</h2>
              <p className="text-xs text-text-secondary">Admin Portal</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-text-secondary hover:bg-secondary hover:text-text-primary"
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-secondary/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.fullName || "Admin"}</p>
              <p className="text-xs text-text-muted truncate capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm text-left"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldCheck size={20} /> Admin Portal
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
