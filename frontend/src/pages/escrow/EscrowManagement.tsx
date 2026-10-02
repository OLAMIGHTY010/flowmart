import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertOctagon, Info, Key } from "lucide-react";

export default function EscrowManagement() {
  const [activeTab, setActiveTab] = useState("buying");

  // Mock data
  const buyingEscrow = {
    id: "ESC-8F7A9B",
    item: "Luxury 4 Bed Detached Duplex",
    amount: 250000000,
    status: "held",
    seller: "Real Estate Pros Ltd",
    timeoutDaysLeft: 6
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">Escrow Management</h1>
            <p className="text-slate-400 text-sm">Track and manage your secure high-value transactions</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-8">
        
        {/* Tabs */}
        <div className="flex bg-gray-200 p-1 rounded-xl mb-8 max-w-xs">
          <button 
            className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${activeTab === 'buying' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('buying')}
          >
            I'm Buying
          </button>
          <button 
            className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${activeTab === 'selling' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('selling')}
          >
            I'm Selling
          </button>
        </div>

        {/* Buying View */}
        {activeTab === 'buying' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <Lock className="h-3 w-3" /> Funds Held Safely
                </span>
                <h3 className="font-black text-2xl text-gray-900">{buyingEscrow.item}</h3>
                <p className="text-gray-500 mt-1">Transaction Ref: {buyingEscrow.id} • Seller: {buyingEscrow.seller}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Locked Amount</p>
                <p className="font-black text-2xl text-blue-700">₦{buyingEscrow.amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              
              <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-800">
                <Info className="h-8 w-8 flex-shrink-0" />
                <p className="text-sm font-medium">
                  <strong>Action Required:</strong> Please inspect the property. If everything looks good, release the funds. If you do nothing, funds will automatically release in <strong>{buyingEscrow.timeoutDaysLeft} days</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <AlertOctagon className="h-5 w-5" /> Raise Dispute
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                  <CheckCircle2 className="h-5 w-5" /> Release Funds to Seller
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Selling View Placeholder */}
        {activeTab === 'selling' && (
          <div className="text-center py-20">
            <Key className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg">No Active Sales</h3>
            <p className="text-gray-500">You don't have any items currently held in escrow by buyers.</p>
          </div>
        )}

      </main>
    </div>
  );
}

// Just adding Lock here since it was missing from the import above
function Lock(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
