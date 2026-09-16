import { useState } from 'react';
import Icon from '@/components/Icon';

export default function WalletTab() {
  const [balance] = useState(1250000);
  const [transactions] = useState([
    { id: '1', desc: 'Payout from FlowMart', amount: 450000, type: 'credit', date: '2026-06-19' },
    { id: '2', desc: 'Order #10293 Settlement', amount: 15000, type: 'credit', date: '2026-06-18' },
    { id: '3', desc: 'Withdrawal to Bank', amount: 200000, type: 'debit', date: '2026-06-15' },
  ]);

  return (
    <div className="flex-1 lg:mt-0 lg:rounded-none bg-background flex flex-col gap-6 px-5 lg:px-8 pt-6 pb-24 lg:pb-8 -mt-4 rounded-t-3xl animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-headings font-extrabold text-foreground">Wallet & Payouts</h2>
      </div>

      <div className="bg-gradient-to-br from-primary to-[#ff9800] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-20">
          <Icon i="credit-card" size={200} />
        </div>
        <p className="text-white/80 font-bold uppercase tracking-wider text-xs mb-2">Available Balance</p>
        <h1 className="text-5xl font-headings font-extrabold">₦{balance.toLocaleString()}</h1>
        
        <div className="mt-8 flex gap-4">
          <button className="bg-white text-primary px-6 py-3 rounded-xl font-extrabold shadow-sm flex items-center gap-2">
            <Icon i="download" size={18} /> Request Payout
          </button>
          <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-bold flex items-center gap-2">
            <Icon i="clock" size={18} /> Next Auto-Payout: Friday
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-headings font-extrabold mb-4">Transaction History</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Icon i={tx.type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{tx.desc}</h4>
                  <p className="text-xs text-muted-foreground font-semibold">{tx.date}</p>
                </div>
              </div>
              <div className={`font-extrabold text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-foreground'}`}>
                {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
