import React from "react";

export default function SideBanner() {
  return (
    <aside className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 shrink-0 overflow-hidden bg-brand-700 text-white">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200"
        alt="Event"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex h-full flex-col justify-between p-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            🌿
          </div>

          <h2 className="text-xl font-bold">FlowMart Portal</h2>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-primary-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-100">
            Partner Event 2025
          </span>

          <h1 className="text-4xl font-bold leading-tight">
            RCCG Holy Ghost Congress 2025
          </h1>

          <p className="text-lg text-white/90">
            Theme:
            <span className="ml-2 font-bold">
              "The God of All Flesh"
            </span>
          </p>

          <p className="text-sm text-white/70">
            December 8 – 14, 2025 • Redemption City, Nigeria
          </p>
        </div>

        {/* Footer */}
        <div className="text-sm text-white/60">
          © 2026 FlowMart. All rights reserved.
        </div>
      </div>
    </aside>
  );
}