import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useOrders, useKYCStatus } from '@/hooks/useVendorQueries';
import { useEffect } from 'react';
import StatCard from '@/components/StatCard';
import Icon from '@/components/Icon';
import ProductsTab from '@/components/ProductsTab';
import OrdersTab from '@/components/OrdersTab';
import StoreTab from '@/components/StoreTab';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const { data: kycStatus, isLoading: kycLoading } = useKYCStatus();

  useEffect(() => {
    if (!kycLoading && kycStatus) {
      if (kycStatus.status === 'unsubmitted') {
        if (!user?.profileCompleted) {
          navigate('/profile-setup', { replace: true });
        } else {
          navigate('/kyc', { replace: true });
        }
      } else if (kycStatus.status !== 'approved') {
        navigate('/kyc/verification', { replace: true });
      }
    }
  }, [kycStatus, kycLoading, user, navigate]);

  // Tab State: 'dashboard' | 'products' | 'orders' | 'store'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'store'>('dashboard');

  // Fetch dashboard queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  if (kycLoading || (kycStatus && kycStatus.status !== 'approved')) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-muted-foreground">Checking verification status...</p>
      </div>
    );
  }

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
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'products', icon: 'package', label: 'Products' },
    { id: 'orders', icon: 'shopping-bag', label: 'Orders' },
    { id: 'store', icon: 'settings', label: 'Store' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'store':
        return <StoreTab />;
      case 'dashboard':
      default:
        return (
          <div className="flex-1 lg:mt-0 lg:rounded-none bg-background flex flex-col gap-6 px-5 lg:px-8 pt-6 pb-24 lg:pb-8 -mt-4 rounded-t-3xl">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
              <StatCard
                label="New Orders"
                value={statsLoading ? '...' : (stats?.newOrders.toString() || '0')}
                icon="bell-ring"
                sub="Pending orders"
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
                sub="Total today"
              />
              <StatCard
                label="Available Stock"
                value={statsLoading ? '...' : (stats?.availableStock.toString() || '0')}
                icon="package"
                sub="items in store"
              />
            </div>

            {/* Layout Split: Left (Orders & Quick Actions) | Right (Weekly Revenue) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Incoming Orders */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Incoming Orders</h2>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none"
                    >
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

                {/* Quick actions */}
                <div>
                  <h2 className="text-base font-headings font-extrabold text-foreground mb-3" style={{ fontWeight: 800 }}>Quick Actions</h2>
                  <div className="flex gap-3">
                    {[
                      { icon: 'plus-circle', label: 'Add Product', tab: 'products' },
                      { icon: 'tag', label: 'Promotions', tab: 'dashboard' },
                      { icon: 'truck', label: 'Deliveries', tab: 'orders' }
                    ].map((a, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (a.tab !== 'dashboard') {
                            setActiveTab(a.tab as any);
                          } else {
                            alert(`${a.label} action triggered.`);
                          }
                        }}
                        className="flex-1 bg-surface border border-border rounded-2xl py-3.5 flex flex-col items-center gap-1.5 hover:bg-muted/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                      >
                        <Icon i={a.icon} size={20} className="text-primary" />
                        <span className="text-xs font-body font-semibold text-foreground">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue chart */}
              <div className="bg-surface border border-border rounded-2xl px-4 py-4 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Weekly Revenue</h2>
                  <span className="text-xs text-primary bg-secondary px-2.5 py-1 rounded-full font-bold">This week</span>
                </div>
                {/* Bar chart */}
                <div className="flex items-end gap-2.5 h-28 pt-2">
                  {(stats?.weeklyRevenue || []).map((bar: any, i: number) => (
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
          </div>
        );
    }
  };

  return (
    <div className="bg-background flex flex-col lg:flex-row font-body min-h-screen">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#090d16] text-white p-6 border-r border-border/10 fixed h-screen z-50">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-headings font-extrabold text-lg">
            F
          </div>
          <div>
            <h2 className="font-headings font-extrabold text-lg leading-none">Flowmart</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Vendor Portal</span>
          </div>
        </div>

        {/* User profile section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground border border-white/20 shadow-inner flex-shrink-0">
            {firstName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold truncate">{user?.fullName || 'Vendor'}</h4>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none bg-transparent text-left w-full ${activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon i={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom logout */}
        <button
          onClick={() => {
            if (window.confirm("Do you want to logout?")) {
              logout().then(() => navigate('/'));
            }
          }}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent text-left w-full mt-auto"
        >
          <Icon i="log-out" size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 pb-20 lg:pb-0">
        {/* Sticky Unified Header (shown on mobile, tab, and desktop) */}
        <div className="sticky top-0 bg-dark-header px-5 lg:px-8 pt-4 pb-8 text-white shadow-md z-30">
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-white/70 font-medium">
                {activeTab === 'dashboard' ? "Good morning," : `FlowMart Vendor, ${firstName}`}
              </p>
              <h1 className="text-xl lg:text-2xl font-headings font-extrabold" style={{ fontWeight: 800 }}>
                {activeTab === 'dashboard' ? firstName : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="hidden md:block text-[11px] text-white/60 mt-0.5">
                {activeTab === 'dashboard' ? "Here's an overview of your store performance today." : `Manage your store ${activeTab} and settings.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative w-9 h-9 lg:w-10 lg:h-10 bg-white/10 hover:bg-white/20 transition rounded-xl flex items-center justify-center cursor-pointer">
                <Icon i="bell" size={18} className="text-white" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div 
                onClick={() => {
                  if (window.confirm("Do you want to logout?")) {
                    logout().then(() => navigate('/'));
                  }
                }}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground border border-white/20 shadow-inner cursor-pointer"
                title="Click to logout"
              >
                {firstName.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-white/90">
                <p className="text-xs font-bold leading-none">{user?.fullName || 'Vendor'}</p>
                <span className="text-[10px] text-white/60">Store Owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tab View Content */}
        <div className="flex-1 flex flex-col">
          {renderActiveTab()}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-2 py-3 flex items-center justify-around z-40 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer hover:opacity-85 transition-all"
            >
              <Icon
                i={item.icon}
                size={22}
                className={activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}
              />
              <span
                className={`text-[10px] font-body font-bold uppercase tracking-wider ${activeTab === item.id ? 'text-primary font-bold' : 'text-muted-foreground font-medium'
                  }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
