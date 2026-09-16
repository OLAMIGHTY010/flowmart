import React, { useState } from 'react';
import { X, Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import { VendorButton } from '../ui/button';
import { apiClient } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

interface PromoteProductModalProps {
  product: any;
  onClose: () => void;
}

export default function PromoteProductModal({ product, onClose }: PromoteProductModalProps) {
  const [durationDays, setDurationDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const pricePerDay = 500; // ₦500 per day
  const totalCost = durationDays * pricePerDay;

  const handlePromote = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.post('/ads', {
        productId: product.id,
        amountPaid: totalCost,
        durationDays: durationDays
      });
      
      if (res.success) {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      } else {
        setError(res.message || 'Failed to promote product');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to promote product');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col p-6 items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Sparkles className="text-emerald-600" size={32} />
          </div>
          <h3 className="font-bold text-xl text-foreground font-headings mb-2">Promotion Active!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            "{product.name}" is now sponsored and will be featured at the top of the catalog for {durationDays} days.
          </p>
          <VendorButton onClick={onClose} className="w-full">
            Awesome!
          </VendorButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            <h3 className="font-bold text-base text-amber-900 font-headings">
              Promote Product
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/50 hover:bg-white transition-colors cursor-pointer"
          >
            <X size={18} className="text-amber-900" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border">
            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
              <img 
                src={product.imageUrl || 'https://placehold.co/100x100?text=Product'} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate text-foreground">{product.name}</h4>
              <p className="text-xs text-muted-foreground">Current Status: <span className="font-semibold text-foreground">{product.isSponsored ? 'Sponsored' : 'Standard'}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col gap-1 items-center text-center">
              <TrendingUp className="text-blue-500 mb-1" size={20} />
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Higher Rank</span>
              <span className="text-xs text-blue-900 font-medium">Appear first in searches</span>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex flex-col gap-1 items-center text-center">
              <Target className="text-purple-500 mb-1" size={20} />
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600">More Sales</span>
              <span className="text-xs text-purple-900 font-medium">Up to 3x more visibility</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Select Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 7, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setDurationDays(days)}
                  className={`py-2 px-1 rounded-xl border-2 transition-all font-semibold text-sm cursor-pointer ${
                    durationDays === days 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Cost</span>
            <span className="text-lg font-headings font-extrabold text-foreground">₦{totalCost.toLocaleString()}</span>
          </div>
          <VendorButton 
            onClick={handlePromote} 
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-md border-none"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
            Pay & Promote
          </VendorButton>
        </div>
      </div>
    </div>
  );
}
