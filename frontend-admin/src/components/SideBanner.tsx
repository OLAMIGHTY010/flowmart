export default function SideBanner() {
  return (
    <div className="relative hidden lg:flex lg:w-2/5 xl:w-1/3 bg-dark-header text-white p-8 flex-col justify-between overflow-hidden sticky top-0 h-screen">
      {/* Background Decorative Overlay */}
      <div className="absolute inset-0 opacity-25 mix-blend-overlay">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200"
          alt="Nigerian marketplace background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Top Branding */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
          🌿
        </div>
        <span className="text-lg font-bold tracking-tight text-white">FlowMart Admin</span>
      </div>

      {/* Event Center Display */}
      <div className="relative z-10 my-auto py-12 flex flex-col gap-4">
        <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary bg-secondary/90 w-fit">
          Nigeria's Super App
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Shop Smarter, Live Better 🇳🇬
        </h1>
        <p className="text-sm text-white/80 leading-relaxed font-light">
          <strong className="font-bold text-white">E-Commerce • Bills • Delivery</strong>
        </p>
        <p className="text-xs text-white/60 leading-relaxed">
          Delivering Across All 36 States + FCT
        </p>
      </div>

      {/* Footer info */}
      <div className="relative z-10 text-xs text-white/50">
        © 2026 FlowMart. All rights reserved.
      </div>
    </div>
  );
}
