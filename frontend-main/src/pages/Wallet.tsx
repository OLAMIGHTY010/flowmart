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
  type: "credit" | "debit";
  description: string;
  createdAt: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddFunds = () => {
    alert("In a real app, this would open Paystack/Flutterwave to deposit funds.");
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
              onClick={handleAddFunds}
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
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'credit' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
