import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Plus, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/services/api";

interface WalletBalance {
  id: string;
  balance: string;
}

interface WalletTransaction {
  id: string;
  amount: string;
  type: "deposit" | "withdrawal" | "payment";
  reference?: string;
  createdAt: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Funds Modal State
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const [balanceRes, txRes] = await Promise.all([
        apiClient.get<{ success: boolean; wallet: WalletBalance }>("/wallet/balance"),
        apiClient.get<{ success: boolean; transactions: WalletTransaction[] }>("/wallet/transactions")
      ]);
      if (balanceRes.wallet) setWallet(balanceRes.wallet);
      if (txRes.transactions) setTransactions(txRes.transactions);
    } catch (error) {
      console.error("Error fetching wallet data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || Number(fundAmount) < 100) {
      alert("Minimum funding amount is ₦100");
      return;
    }

    setFunding(true);
    try {
      // Initialize transaction via backend
      const res = await apiClient.post<{ success: boolean; paymentUrl: string }>("/wallet/fund", {
        amount: Number(fundAmount),
        gateway: "paystack"
      });

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        alert("Failed to initialize payment gateway.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to initialize payment");
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <WalletIcon className="h-6 w-6 text-orange-500" /> My Wallet
      </h1>

      <Card className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
        <div className="p-8">
          <p className="text-gray-400 font-medium">Total Balance</p>
          <h2 className="mt-2 text-5xl font-extrabold tracking-tight">
            ₦{parseFloat(wallet?.balance || "0").toLocaleString()}
          </h2>
          
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setShowFundModal(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 cursor-pointer"
            >
              <Plus className="h-5 w-5" /> Add Funds
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/20 cursor-pointer">
              Withdraw
            </button>
          </div>
        </div>
      </Card>

      {/* Add Funds Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Fund Wallet via Paystack</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the amount you wish to add to your wallet.</p>
            
            <form onSubmit={handleFundSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g. 5000"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={funding || !fundAmount}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {funding ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Proceed to Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-bold text-gray-900">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'deposit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 capitalize">{tx.type} {tx.reference ? `(${tx.reference})` : ''}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>))}
          </div>
        )}
      </div>
    </div>
  );
}
