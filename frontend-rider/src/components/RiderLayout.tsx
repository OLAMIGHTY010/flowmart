import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function RiderLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-sm pb-[70px]">
        {/* Child routes injected here */}
        <Outlet />

        {/* Global sticky navigation bar */}
        <BottomNav />
      </div>
    </div>
  );
}
