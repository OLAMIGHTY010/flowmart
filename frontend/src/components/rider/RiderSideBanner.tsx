import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

export default function SideBanner() {
  const { user, logout } = useAuth();

  return (
    <div className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 bg-dark-header text-white p-8 flex-col justify-between overflow-hidden sticky top-0 h-screen">
      {/* Background Decorative Overlay */}
      <div className="absolute inset-0 opacity-25 mix-blend-overlay">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200"
          alt="Worship scene background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Top Branding */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
            🌿
          </div>
          <span className="text-lg font-bold tracking-tight text-white">FlowMart Portal</span>
        </div>
        
        {user && (
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        )}
      </div>

      {/* Event Center Display */}
      <div className="relative z-10 my-auto py-12 flex flex-col gap-4">
        <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary bg-secondary/90 w-fit">
          Partner Event 2025
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          RCCG Holy Ghost Congress 2025
        </h1>
        <p className="text-sm text-white/80 leading-relaxed font-light">
          Theme: <strong className="font-bold text-white">"The God of All Flesh"</strong>
        </p>
        <p className="text-xs text-white/60 leading-relaxed">
          December 8 – 14, 2025 • Redemption City, Nigeria
        </p>
      </div>

      {/* Footer info */}
      <div className="relative z-10 text-xs text-white/50">
        © 2026 FlowMart. All rights reserved.
      </div>
    </div>
  );
}
