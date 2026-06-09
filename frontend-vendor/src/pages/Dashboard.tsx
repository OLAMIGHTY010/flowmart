import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useOrders } from '@/hooks/useVendorQueries';
import StatCard from '@/components/StatCard';
import Icon from '@/components/Icon';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Fetch dashboard queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Helper to format currency
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  // Extract first name from full name
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Vendor';

  // Navigation Items
  const navItems = [
    { icon: 'home', label: 'Home', active: true },
    { icon: 'package', label: 'Products', active: false },
    { icon: 'shopping-bag', label: 'Orders', active: false },
    { icon: 'bar-chart-2', label: 'Analytics', active: false },
    { icon: 'settings', label: 'Settings', active: false },
  ];

  return (
    <div className="bg-background flex flex-col font-body min-h-screen">
      {/* Header */}
      <div className="bg-dark-header px-5 pt-2 pb-8 text-white rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-white/70 font-medium">Good morning,</p>
            <h1 className="text-xl font-headings font-extrabold" style={{ fontWeight: 800 }}>
              {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 bg-white/10 hover:bg-white/20 transition rounded-full flex items-center justify-center cursor-pointer">
              <Icon i="bell" size={18} className="text-white" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div 
              onClick={() => {
                if (window.confirm("Do you want to logout?")) {
                  logout().then(() => navigate('/'));
                }
              }}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground border border-white/20 shadow-inner cursor-pointer"
              title="Click to logout"
            >
              {firstName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 -mt-4 rounded-t-3xl bg-background flex flex-col gap-6 px-5 pt-6 pb-24">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="New Orders" 
            value={statsLoading ? '...' : (stats?.newOrders.toString() || '0')} 
            icon="bell-ring" 
            sub="+3 since yesterday" 
          />
          <StatCard 
            label="In Progress" 
            value={statsLoading ? '...' : (stats?.inProgress.toString() || '0')} 
            icon="loader" 
            sub="Active deliveries" 
          />
          <StatCard 
            label="Revenue Today" 
            value={statsLoading ? '...' : (stats?.revenueToday || '₦0')} 
            icon="trending-up" 
            accent 
            sub="vs ₦97K yesterday" 
          />
          <StatCard 
            label="Available Stock" 
            value={statsLoading ? '...' : (stats?.availableStock.toString() || '0')} 
            icon="package" 
            sub="items in store" 
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          {[
            { icon: 'plus-circle', label: 'Add Product' },
            { icon: 'tag', label: 'Promotions' },
            { icon: 'truck', label: 'Deliveries' }
          ].map((a, i) => (
            <button 
              key={i} 
              onClick={() => alert(`${a.label} action triggered.`)}
              className="flex-1 bg-surface border border-border rounded-2xl py-3.5 flex flex-col items-center gap-1.5 hover:bg-muted/30 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Icon i={a.icon} size={20} className="text-primary" />
              <span className="text-xs font-body font-semibold text-foreground">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Incoming Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Incoming Orders</h2>
            <button onClick={() => alert("Redirecting to all orders")} className="text-xs text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none">
              View all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {ordersLoading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">Loading orders...</div>
            ) : orders && orders.length > 0 ? (
              orders.slice(0, 3).map((order, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon i="shopping-cart" size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-bold">{order.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-semibold mt-0.5">
                      {order.deliveryZone || 'Fulfillment Order'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm text-foreground font-bold">{formatCurrency(order.totalAmount)}</span>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                      <span className="text-[10px] text-warning font-bold uppercase tracking-wider">{order.status}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground bg-surface border border-dashed border-border rounded-2xl">
                No incoming orders
              </div>
            )}
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Weekly Revenue</h2>
            <span className="text-xs text-primary bg-secondary px-2.5 py-1 rounded-full font-bold">This week</span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2.5 h-24 pt-2">
            {(stats?.weeklyRevenue || [
              { day: 'Mon', h: 55 },
              { day: 'Tue', h: 70 },
              { day: 'Wed', h: 45 },
              { day: 'Thu', h: 80 },
              { day: 'Fri', h: 65 },
              { day: 'Sat', h: 100 },
            ]).map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${i === 5 ? 'bg-primary' : 'bg-secondary'}`}
                  style={{ height: `${bar.h}%`, minHeight: '10%' }}
                />
                <span className="text-[10px] text-muted-foreground font-semibold">{bar.day}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Revenue</p>
              <p className="text-lg font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                {statsLoading ? '...' : (stats?.totalRevenue || '₦0')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Avg Order</p>
              <p className="text-lg font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>
                {statsLoading ? '...' : (stats?.avgOrder || '₦0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-2 py-3 flex items-center justify-around z-40 shadow-lg">
        {navItems.map((item, i) => (
          <button 
            key={i} 
            onClick={() => alert(`Tab ${item.label} clicked.`)}
            className="flex flex-col items-center gap-1 px-3 py-1 bg-transparent border-none cursor-pointer hover:opacity-85 transition-all"
          >
            <Icon i={item.icon} size={22} className={item.active ? 'text-primary' : 'text-muted-foreground'} />
            <span 
              className={`text-[10px] font-body font-bold uppercase tracking-wider ${item.active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
