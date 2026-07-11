import logoImg from '@/assets/flowmart-logo.png';

export default function SideBanner() {
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
      <div className="relative z-10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center p-1">
          <img src={logoImg} alt="FlowMart Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">FlowMart Portal</span>
      </div>

      {/* Main Display */}
      <div className="relative z-10 my-auto py-12 flex flex-col gap-4">
        <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary bg-secondary/90 w-fit">
          Vendor & Logistics Partner
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Welcome to the FlowMart Network
        </h1>
        <p className="text-sm text-white/80 leading-relaxed font-light">
          Join our ecosystem to <strong className="font-bold text-white">sell products and manage logistics</strong> seamlessly.
        </p>
        <p className="text-xs text-white/60 leading-relaxed">
          Empowering businesses across the globe.
        </p>
      </div>

      {/* Footer info */}
      <div className="relative z-10 text-xs text-white/50">
        © 2026 FlowMart. All rights reserved.
      </div>
    </div>
  );
}
