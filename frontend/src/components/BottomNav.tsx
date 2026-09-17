import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, DollarSign, User } from 'lucide-react';

export default function BottomNav() {
  const tabs = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Deliveries', icon: Package, path: '/deliveries' },
    { label: 'Earnings', icon: DollarSign, path: '/earnings' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/70 flex justify-around py-2.5 z-40 max-w-md mx-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-bold flex-1 bg-transparent border-none transition-colors ${
              isActive ? 'text-[#006837]' : 'text-muted-foreground/60 hover:text-foreground'
            }`
          }
        >
          <tab.icon size={22} className="mb-0.5" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
