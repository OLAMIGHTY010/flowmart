import { useState } from 'react';
import { useOrders } from '@/hooks/vendor/useVendorQueries';
import { useUpdateOrderStatus } from '@/hooks/vendor/useVendorMutations';
import { Loader2, ChevronDown, ChevronUp, Check, X, Filter } from 'lucide-react';

export default function OrdersTab() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  // Active filter tab
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  
  // Expanded card ID
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (err) {
      console.error('Update status error', err);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o: any) => {
    if (filter === 'all') return true;
    if (filter === 'processing') return ['confirmed', 'assigned', 'picked_up'].includes(o.status);
    if (filter === 'completed') return o.status === 'delivered';
    return o.status === filter;
  });

  // Calculate stats from orders
  const totalOrdersCount = orders.length;
  const totalRevenueAmount = orders
    .filter((o: any) => o.status === 'delivered' || o.status === 'confirmed' || o.status === 'assigned' || o.status === 'picked_up')
    .reduce((acc: number, o: any) => acc + (parseFloat(o.totalAmount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-background font-body pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-xl font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Orders</h1>
        <button className="p-2 rounded-xl bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb] transition-all cursor-pointer">
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'processing', label: 'Processing' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === t.id
                ? 'bg-[#064e3b] text-white'
                : 'bg-[#f3f4f6] text-muted-foreground hover:bg-[#e5e7eb]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stats Summary Card */}
      <div className="px-5 mb-4 grid grid-cols-2 gap-3">
        <div className="bg-[#dcfce7] rounded-2xl p-3 text-center border border-[#bbf7d0]">
          <p className="text-[10px] text-[#15803d] uppercase font-bold tracking-wider">Total Orders</p>
          <p className="text-lg font-headings font-extrabold text-[#166534] mt-0.5">{totalOrdersCount} orders</p>
        </div>
        <div className="bg-[#dcfce7] rounded-2xl p-3 text-center border border-[#bbf7d0]">
          <p className="text-[10px] text-[#15803d] uppercase font-bold tracking-wider">Revenue</p>
          <p className="text-lg font-headings font-extrabold text-[#166534] mt-0.5">₦{totalRevenueAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-grow px-5 flex flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order: any) => {
            const isExpanded = expandedId === order.id;
            
            // Format status pills
            let statusPill = 'bg-[#fef9c3] text-[#a16207]'; // pending
            if (['confirmed', 'assigned', 'picked_up'].includes(order.status)) statusPill = 'bg-[#dbeafe] text-[#1e40af]'; // processing
            if (order.status === 'delivered') statusPill = 'bg-[#dcfce7] text-[#15803d]'; // completed
            if (order.status === 'cancelled') statusPill = 'bg-[#fee2e2] text-[#b91c1c]'; // cancelled

            const displayStatus = ['confirmed', 'assigned', 'picked_up'].includes(order.status) ? 'processing' : order.status === 'delivered' ? 'completed' : order.status;

            // Format items text
            const itemsText = order.items
              ? order.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')
              : 'Items Loading...';

            return (
              <div 
                key={order.id} 
                className="bg-surface border border-border/70 rounded-2xl p-4 flex flex-col gap-3 shadow-xs hover:border-primary/20 transition-all"
              >
                {/* Header card summary */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="flex items-start justify-between cursor-pointer"
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-bold">#{order.orderRef || `ORD${order.id.substring(0,6).toUpperCase()}`}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusPill}`}>
                        {displayStatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mt-1.5">{order.attendeeName || 'Unknown Attendee'}</h3>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{itemsText}</p>
                    )}
                    <p className="text-sm font-bold text-foreground mt-2">₦{parseFloat(order.totalAmount).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Today, {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/80 pt-3 mt-1 flex flex-col gap-3">
                    {/* Items List */}
                    <div>
                      <h4 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Items</h4>
                      <div className="flex flex-col gap-1.5">
                        {order.items && order.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between items-center text-xs text-foreground">
                            <span>{it.productName} <span className="text-muted-foreground">x{it.quantity}</span></span>
                            <span className="font-semibold">₦{(parseFloat(it.unitPrice) * it.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address & Payment Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Delivery Details</h4>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed font-medium">
                          Zone: {order.deliveryZone || 'Fulfillment Center'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Phone: {order.attendeePhone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Payment</h4>
                        <p className="text-xs text-foreground mt-0.5 font-semibold">
                          {order.paymentMethod || 'Paid online'}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons (only for pending orders) */}
                    {(order.status === 'pending') && (
                      <div className="flex gap-2.5 mt-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <Check size={14} />
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 border border-red-500 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        >
                          <X size={14} />
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground bg-surface border border-dashed border-border/80 rounded-2xl">
            No orders in this tab
          </div>
        )}
      </div>
    </div>
  );
}
