import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/Icon';

export default function CouponsTab() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Simulating fetch - in a real app this would call apiClient.get('/coupons/vendor')
  useEffect(() => {
    setCoupons([
      { id: '1', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, validUntil: '2026-12-31', active: true, usesCount: 5 }
    ]);
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon = {
      id: Math.random().toString(),
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      validUntil,
      active: true,
      usesCount: 0
    };
    setCoupons([...coupons, newCoupon]);
    setShowModal(false);
  };

  return (
    <div className="flex-1 lg:mt-0 lg:rounded-none bg-background flex flex-col gap-6 px-5 lg:px-8 pt-6 pb-24 lg:pb-8 -mt-4 rounded-t-3xl animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-headings font-extrabold text-foreground">Discount Coupons</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm shadow-sm"
        >
          <Icon i="plus" size={16} /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-bl-lg">
              {coupon.active ? 'Active' : 'Expired'}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Icon i="tag" size={24} />
              </div>
              <div>
                <h3 className="font-headings font-extrabold text-lg text-foreground tracking-widest">{coupon.code}</h3>
                <p className="text-xs text-muted-foreground font-semibold uppercase">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₦${coupon.discountValue} OFF`}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground border-t border-border pt-4">
              <span>Uses: <strong className="text-foreground">{coupon.usesCount}</strong></span>
              <span>Expires: <strong className="text-foreground">{new Date(coupon.validUntil).toLocaleDateString()}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <Icon i="x" size={20} />
            </button>
            <h2 className="text-xl font-extrabold mb-6">Create New Coupon</h2>
            
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Coupon Code</label>
                <input required value={code} onChange={e => setCode(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 mt-1 font-bold text-foreground focus:ring-2 focus:ring-primary outline-none uppercase" placeholder="e.g. SUMMER20" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Discount Type</label>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 mt-1 font-bold text-foreground focus:ring-2 focus:ring-primary outline-none">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Value</label>
                  <input required type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 mt-1 font-bold text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="10" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Min Order (₦)</label>
                  <input type="number" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 mt-1 font-bold text-foreground focus:ring-2 focus:ring-primary outline-none" placeholder="0" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Expires On</label>
                  <input required type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 mt-1 font-bold text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-extrabold uppercase tracking-wide mt-6">
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
