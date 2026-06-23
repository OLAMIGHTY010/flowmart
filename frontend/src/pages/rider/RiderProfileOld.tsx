import React from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Bell,
  Lock,
  Truck,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { RiderButton } from "@/components/ui/button";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Personal Information", icon: User, path: "/edit-profile" },
    { label: "Vehicle & Documents", icon: Truck, path: "/kyc" },
    { label: "Notifications", icon: Bell, path: "/alerts" },
    { label: "Privacy & Security", icon: Lock, path: "/privacy-security" },
    { label: "Help & Support", icon: HelpCircle, path: "/help-support" },
    { label: "Terms of Service", icon: FileText, path: "/terms" },
  ];

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'RD';

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] font-body min-h-screen pb-24">
      <div className="px-5 pt-8 pb-6 bg-[#15803d] flex flex-col items-center justify-center relative shadow-sm">
        <div className="absolute top-4 right-5">
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ShieldCheck size={16} className="text-white" />
          </button>
        </div>
        
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-600 mb-3">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-[#15803d]">{initials}</span>
          )}
        </div>
        
        <h1 className="text-xl font-bold text-white mb-1">{user?.fullName || ""}</h1>
        <p className="text-xs text-emerald-100 bg-white/10 px-3 py-1 rounded-full font-medium">
          {user?.email || ""}
        </p>
      </div>

      <div className="px-5 mt-6 flex-1 flex flex-col gap-2 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-2 border border-slate-100 shadow-xs flex flex-col">
          {menuItems.map((item, index) => (
            <div key={index} className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 rounded-2xl" onClick={() => navigate(item.path)}>
              <div className="w-10 h-10 rounded-full bg-[#f0fdf4] flex items-center justify-center shrink-0">
                <item.icon size={20} className="text-[#15803d]" />
              </div>
              <div className="flex-1 font-semibold text-sm text-slate-700">
                {item.label}
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}
        </div>

        <RiderButton 
          variant="outline" 
          onClick={handleLogout}
          className="mt-6 w-full py-6 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl flex items-center gap-2 justify-center font-bold"
        >
          <LogOut size={18} />
          Sign Out
        </RiderButton>
      </div>
    </div>
  );
}
