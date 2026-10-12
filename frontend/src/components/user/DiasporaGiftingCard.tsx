import React, { useState, useEffect } from 'react';
import { Globe, Gift, ArrowRightLeft, Sparkles, Check } from 'lucide-react';
import { automationServices } from '../../services/AutomationServices';

interface Props {
  cartTotalNgn: number;
  onCurrencyChange?: (currency: string, convertedAmount: number) => void;
}

export const DiasporaGiftingCard: React.FC<Props> = ({
  cartTotalNgn = 65000,
  onCurrencyChange,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NGN');
  const [quote, setQuote] = useState<any>(null);
  const [isGift, setIsGift] = useState<boolean>(false);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const currencies = [
    { code: 'NGN', label: '₦ NGN (Nigeria)' },
    { code: 'USD', label: '$ USD (United States)' },
    { code: 'GBP', label: '£ GBP (United Kingdom)' },
    { code: 'EUR', label: '€ EUR (Europe)' },
    { code: 'KES', label: 'KSh KES (Kenya)' },
    { code: 'GHS', label: 'GH₵ GHS (Ghana)' },
    { code: 'ZAR', label: 'R ZAR (South Africa)' },
  ];

  const updateQuote = async (currency: string) => {
    if (currency === 'NGN') {
      setQuote(null);
      if (onCurrencyChange) onCurrencyChange('NGN', cartTotalNgn);
      return;
    }

    setLoading(true);
    try {
      const res = await automationServices.getDiasporaQuote({
        cartTotalNgn,
        buyerCurrency: currency,
        recipientCity: 'Lagos',
        recipientCountry: 'Nigeria',
        giftMessage: isGift ? giftMessage : undefined,
      });

      if (res?.quote) {
        setQuote(res.quote);
        if (onCurrencyChange) {
          onCurrencyChange(currency, res.quote.convertedAmount);
        }
      }
    } catch (err) {
      console.error('Failed to get diaspora quote', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateQuote(selectedCurrency);
  }, [selectedCurrency, cartTotalNgn, isGift]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              Diaspora & Multi-Currency Checkout
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                Live FX
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Pay in London/USA, deliver to your loved ones in Nigeria
            </p>
          </div>
        </div>
      </div>

      {/* Currency Switcher */}
      <div className="flex flex-wrap gap-2">
        {currencies.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCurrency(c.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCurrency === c.code
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* Quote Display */}
      {selectedCurrency !== 'NGN' && quote && (
        <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Foreign Card Charge:</span>
            <span className="text-base font-bold text-purple-300">
              {quote.targetCurrency === 'USD' ? '$' : quote.targetCurrency === 'GBP' ? '£' : '€'}
              {quote.convertedAmount?.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-1.5">
            <span>Guaranteed Local Merchant Value:</span>
            <span className="text-emerald-400 font-semibold">₦{cartTotalNgn.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Gift Delivery Option */}
      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
          <input
            type="checkbox"
            checked={isGift}
            onChange={(e) => setIsGift(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-purple-500"
          />
          <span className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            Send as Diaspora Gift Package with custom note
          </span>
        </label>

        {isGift && (
          <input
            type="text"
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value)}
            placeholder="e.g. Happy Birthday Mom from London! ❤️"
            className="mt-2 w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        )}
      </div>
    </div>
  );
};
