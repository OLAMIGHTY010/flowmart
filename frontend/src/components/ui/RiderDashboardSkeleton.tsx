import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-[#eafbea] overflow-hidden w-full">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-[#164a28] flex-shrink-0 flex flex-col p-4 border-r border-[#1a5730]">
        <div className="h-10 bg-[#25633a] rounded-md mb-8 w-3/4 animate-pulse"></div>
        <div className="space-y-6 flex-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#25633a] rounded-full animate-pulse"></div>
              <div className="h-4 bg-[#25633a] rounded animate-pulse" style={{ width: `${80 - (i * 5)}%`, opacity: 1 - i * 0.05 }}></div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[#1a5730]">
          <div className="w-8 h-8 bg-[#25633a] rounded-full animate-pulse"></div>
          <div className="h-4 bg-[#25633a] rounded w-2/3 animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
        {/* Top Cards (4) */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="h-4 bg-green-100 rounded w-1/2 animate-pulse"></div>
                <div className="w-8 h-8 bg-green-100 rounded-full animate-pulse"></div>
              </div>
              <div className="h-8 bg-green-100 rounded w-3/4 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Center Loading Indicator */}
        <div className="flex items-center justify-center py-2 mb-6">
          <div className="flex items-center gap-2 text-green-500 font-medium">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Loading your dashboard</span>
          </div>
        </div>

        {/* Middle Cards (2: left is wide, right is narrower) */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col gap-6">
            <div className="h-5 bg-green-100 rounded w-1/3 animate-pulse mb-2"></div>
            <div className="space-y-4 flex-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 bg-green-50/80 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-green-50/80 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-green-50/80 rounded w-1/4 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-1 bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col gap-4">
            <div className="h-5 bg-green-100 rounded w-1/2 animate-pulse mb-4"></div>
            <div className="space-y-4 flex-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-5 h-5 bg-green-50/80 rounded-full flex-shrink-0 animate-pulse"></div>
                  <div className="h-4 bg-green-50/80 rounded flex-1 animate-pulse" style={{ maxWidth: `${90 - i*8}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Wide Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 h-[200px] flex flex-col gap-6">
          <div className="h-5 bg-green-100 rounded w-1/6 animate-pulse mb-2"></div>
          <div className="grid grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="space-y-4">
                <div className="h-4 bg-green-50/80 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-green-50/80 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-green-50/80 rounded w-4/5 animate-pulse"></div>
                <div className="h-4 bg-green-50/80 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
