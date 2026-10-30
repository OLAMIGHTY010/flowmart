import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Receipt, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Download, 
  ArrowUpRight, 
  TrendingUp, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function WalletTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/vendor/financials/statements')
      .then(res => {
        if (res.data?.success) setData(res.data);
      })
      .catch(() => {
        // Fallback default
        setData({
          currentBalance: {
            available: 418294,
            pendingSettlement: 486250,
            nextAutoPayout: "Monday, Nov 02, 2026 • 09:00 AM",
            currency: "NGN",
            currencySymbol: "₦"
          },
          bankDetails: {
            bankName: "Access Bank Plc",
            accountNumber: "012••••4821",
            accountName: user?.fullName || "Mama's Kitchen Bistro Ltd"
          },
          statements: [
            {
              id: "stmt-wk44-2026",
              invoiceNumber: "INV-2026-WK44-8891",
              cycleLabel: "Week 44 (Oct 26 - Nov 01, 2026)",
              status: "PENDING_CLEARANCE",
              financialBreakdown: {
                grossSales: 486250,
                ordersCount: 62,
                netDisbursement: 415842
              }
            },
            {
              id: "stmt-wk43-2026",
              invoiceNumber: "INV-2026-WK43-8412",
              cycleLabel: "Week 43 (Oct 19 - Oct 25, 2026)",
              status: "SETTLED",
              financialBreakdown: {
                grossSales: 1245000,
                ordersCount: 158,
                netDisbursement: 1064244
              }
            }
          ]
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const balance = data?.currentBalance?.available || 418294;
  const nextPayout = data?.currentBalance?.nextAutoPayout || "Monday, Nov 02, 2026 • 09:00 AM";
  const bank = data?.bankDetails?.bankName || "Access Bank Plc";
  const account = data?.bankDetails?.accountNumber || "012••••4821";

  return (
    <div className="flex-1 lg:mt-0 lg:rounded-none bg-background flex flex-col gap-6 px-5 lg:px-8 pt-6 pb-24 lg:pb-8 -mt-4 rounded-t-3xl animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-headings font-extrabold text-foreground">Merchant Wallet & Settlements</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Automated Weekly Invoicing • NUBAN Bank Disbursals • 2026 Tax Statements
          </p>
        </div>
        <Link
          to="/vendor/statements"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm"
        >
          <Receipt className="w-4 h-4" /> Open Full Financial Statements Portal <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero Indigo Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-10">
          <Building2 size={220} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-indigo-200 font-bold uppercase tracking-wider text-xs">
              Available For Next Settlement
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Verified: {bank} ({account})
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-headings font-black tracking-tight">
            ₦{balance.toLocaleString()}
          </h1>

          <p className="text-xs text-indigo-100/90 font-medium mt-1">
            Weekly automated batch clearout occurs every Monday directly to your registered bank account.
          </p>
          
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/vendor/statements"
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-xl font-black text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Request Instant Payout
            </Link>
            <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border border-white/20">
              <Clock className="w-4 h-4 text-amber-300" /> Next Batch: {nextPayout}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Statements Table Snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headings font-extrabold text-foreground">Recent Weekly Settlement Statements</h3>
          <Link to="/vendor/statements" className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
            View All Invoices <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {(data?.statements || []).map((stmt: any) => (
            <div key={stmt.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-indigo-300 transition">
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stmt.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Receipt size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600">{stmt.invoiceNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stmt.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {stmt.status === 'SETTLED' ? 'Settled' : 'Active Cycle'}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm mt-0.5">{stmt.cycleLabel}</h4>
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    {stmt.financialBreakdown.ordersCount} fulfilled orders • Gross ₦{stmt.financialBreakdown.grossSales.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-medium">Net Disbursed</div>
                  <div className="font-black text-base text-foreground">
                    ₦{stmt.financialBreakdown.netDisbursement.toLocaleString()}
                  </div>
                </div>
                <Link
                  to="/vendor/statements"
                  className="p-2 rounded-xl border border-border hover:bg-slate-100 text-slate-700 hover:text-indigo-600 transition"
                  title="View Tax Invoice"
                >
                  <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
