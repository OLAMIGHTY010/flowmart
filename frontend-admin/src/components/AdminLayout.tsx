import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Truck, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu, 
  X,
  Search,
  Bell,
  LogOut,
  Car,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/flowmart-logo.png';

const getInitials = (name?: string) => {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getLastName = (name?: string) => {
  if (!name) return 'Admin';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || 'Admin';
};

// Items dynamically generated based on role

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    const role = user?.role as string;
    
    if (role === 'super_admin' || role === 'admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/users', label: 'User Management', icon: Users },
        { path: '/vendors', label: 'Vendor Approvals', icon: UserCheck },
        { path: '/distribution', label: 'Distribution Events', icon: Truck },
        { path: '/riders', label: 'Riders (Live)', icon: Car },
        { path: '/rider-approvals', label: 'Rider Approvals', icon: UserCheck },
        { path: '/analytics', label: 'Platform Analytics', icon: BarChart3 },
        { path: '/audit-logs', label: 'Audit Log', icon: FileText },
        { path: '/settings', label: 'Settings', icon: Settings },
      ];
    } else if (role === 'zone_coordinator' || role === 'camp_logistics_coordinator') {
      return [
        { path: '/coordinator-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/events/create', label: 'Create Event', icon: PlusCircle },
        { path: '/tracker', label: 'Live Tracker', icon: Truck },
        { path: '/riders', label: 'Rider Management', icon: Users },
        { path: '/coordinator-analytics', label: 'Analytics', icon: BarChart3 },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="h-screen bg-[#f8fafc] flex overflow-hidden font-body">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-[#0f172a] text-slate-300
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 flex flex-col items-start border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="w-full h-8 rounded bg-white flex items-center justify-center p-1">
                <img src={logo} alt="FlowMart Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <button 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-3 py-1 bg-[#16a34a] text-white text-[10px] font-bold tracking-widest rounded-full uppercase">
            {user?.role?.replace(/_/g, ' ') || 'USER'}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-slate-800/80 text-white border-l-4 border-[#16a34a] pl-2 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white pl-3'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-[#16a34a]' : 'text-slate-400'} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-0 lg:ml-64 transition-all duration-300">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900 font-headings">System Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">Super Admin Portal — Platform Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search platform..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="flex items-center gap-3 cursor-pointer pl-2 sm:pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 font-bold text-sm">
                    {getInitials(user?.fullName)}
                  </span>
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {getLastName(user?.fullName)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-brand-navy text-slate-300 py-4 px-6 text-xs sm:text-sm font-medium shrink-0 text-center">
          Copyright © 2026 FlowMart. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
