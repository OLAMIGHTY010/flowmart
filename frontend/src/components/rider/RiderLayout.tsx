import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Bike, Package, Wallet, Settings, LogOut, Bell } from "lucide-react";

const navItems = [
  { path: "/rider/dashboard", label: "Dashboard", icon: Bike },
  { path: "/rider/deliveries", label: "Deliveries", icon: Package },
  { path: "/rider/earnings", label: "Earnings", icon: Wallet },
  { path: "/rider/profile", label: "Profile", icon: Settings },
];

const RiderLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Rider';
  const initials = firstName.substring(0, 2).toUpperCase();

  // Determine Title & Subtitle based on route path
  let title = firstName;
  let subtitle = "Here's an overview of your performance today.";
  const path = location.pathname;

  if (path.includes("/rider/deliveries")) {
    title = "Deliveries";
    subtitle = "Manage your active and completed delivery jobs.";
  } else if (path.includes("/rider/earnings")) {
    title = "Earnings";
    subtitle = "Track your payout transactions and balances.";
  } else if (path.includes("/rider/profile")) {
    title = "Profile";
    subtitle = "Manage your account settings and vehicle documents.";
  }

  const handleLogoutClick = () => {
    if (window.confirm("Do you want to logout?")) {
      logout().then(() => navigate('/'));
    }
  };

  return (
    <div className="bg-background flex flex-col lg:flex-row font-body min-h-screen">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#090d16] text-white p-6 border-r border-border/10 fixed h-screen z-50">
        {/* User profile section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white border border-white/20 shadow-inner flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold truncate">{user?.fullName || 'Rider'}</h4>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5 font-bold truncate">ID: #{user?.id?.substring(0, 8) || 'N/A'}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = path === item.path;
            const IconComp = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none bg-transparent text-left w-full ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                <IconComp size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom logout */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent text-left w-full mt-auto"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 pb-20 lg:pb-0">
        
        {/* Sticky Unified Header */}
        <div className="sticky top-0 bg-dark-header px-5 lg:px-8 pt-4 pb-8 text-white shadow-md z-30">
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-white/70 font-medium">
                {path === '/rider/dashboard' ? "Good morning," : "FlowMart Rider"}
              </p>
              <h1 className="text-xl lg:text-2xl font-headings font-extrabold" style={{ fontWeight: 800 }}>
                {title}
              </h1>
              <p className="hidden md:block text-[11px] text-white/60 mt-0.5">
                {subtitle}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="relative w-9 h-9 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/20 transition rounded-xl flex items-center justify-center cursor-pointer">
                <Bell size={18} className="text-white" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div 
                onClick={handleLogoutClick}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm text-white border border-white/20 shadow-inner cursor-pointer"
                title="Click to logout"
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left text-white/90">
                <p className="text-xs font-bold leading-none">{user?.fullName || 'Rider'}</p>
                <span className="text-[10px] text-white/60">Dispatch Rider</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Routed Content View */}
        <main className="flex-1 flex flex-col p-5 lg:p-8 bg-background">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden" style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          right: "16px",
          backgroundColor: "var(--color-bg-primary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          zIndex: 40,
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          borderRadius: "24px",
          border: "1px solid var(--color-border)",
        }}>
          {navItems.map((item) => {
            const isActive = path === item.path;
            const IconComp = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer transition-transform"
                style={{
                  color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                  transform: isActive ? "translateY(-2px)" : "none",
                }}
              >
                <IconComp size={24} />
                <span style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  textTransform: "capitalize"
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default RiderLayout;
