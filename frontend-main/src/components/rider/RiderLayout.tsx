import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Home, Package, DollarSign, User, LogOut, Menu, X, Search, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// If logo is not available, we use text
// import logo from '@/assets/flowmart-logo.png';

const getInitials = (name?: string) => {
  if (!name) return 'RD';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getLastName = (name?: string) => {
  if (!name) return 'Rider';
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || 'Rider';
};

export default function RiderLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Sidebar state not strictly needed for mobile because of BottomNav, 
  // but keeping it if we want an off-canvas menu later.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Deliveries', icon: Package, path: '/deliveries' },
    { label: 'Earnings', icon: DollarSign, path: '/earnings' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="h-screen bg-[#f8fafc] flex overflow-hidden font-body">
      
      {/* Side Nav for tablet/desktop (Admin Design) */}
      <aside 
        className={`
          hidden md:flex flex-col fixed inset-y-0 left-0 z-50
          w-64 bg-[#0f172a] text-slate-300
          transform transition-transform duration-300 ease-in-out
        `}
      >
        <div className="p-6 flex flex-col items-start border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4 w-full justify-between">
            <h2 className="text-2xl font-black text-white">FlowMart</h2>
          </div>
          <div className="px-3 py-1 bg-[#16a34a] text-white text-[10px] font-bold tracking-widest rounded-full uppercase">
            RIDER PORTAL
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {tabs.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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

      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all duration-300 h-screen relative pb-[70px] md:pb-0">
        
        {/* Header - Desktop Only (Matches Admin) */}
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-6 items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-900 font-headings">Rider Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">Manage deliveries and earnings</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all">
              <Search size={16} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="relative cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="flex items-center gap-3 cursor-pointer pl-2 sm:pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#047857] text-white overflow-hidden flex items-center justify-center font-bold text-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Rider" className="w-full h-full object-cover" />
                ) : (
                  <span>{getInitials(user?.fullName)}</span>
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

        {/* Child routes injected here */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>

        {/* Global sticky navigation bar for mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
