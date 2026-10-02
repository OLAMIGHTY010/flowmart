import { Building2, FileText, Plus, ShieldAlert } from "lucide-react";

export default function CorporateDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-slate-900 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">Acme Corp Ltd.</h1>
              <p className="text-slate-400 text-sm">Corporate Buyer Portal</p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
            New Bulk Order
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-8 space-y-8">
        
        {/* Wallet & Credit Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium mb-1">Available Credit</p>
            <h2 className="text-3xl font-black text-gray-900">₦5,000,000</h2>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-semibold cursor-pointer">
              <Plus className="h-4 w-4 mr-1" /> Request Limit Increase
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium mb-1">Current Balance</p>
            <h2 className="text-3xl font-black text-red-600">-₦1,250,000</h2>
            <p className="text-sm text-gray-500 mt-2">Due in 14 days (Net 30)</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900">Pay by Invoice</h3>
                <p className="text-sm text-blue-700 mt-1">Your corporate account allows negative wallet balances. Settle your balance at the end of the month.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Invoices */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg">Recent Invoices</h3>
            <button className="text-blue-600 font-medium text-sm">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">Invoice #</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1,2,3].map(i => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">INV-2026-{900+i}</td>
                    <td className="p-4 text-gray-500">Oct 1, 2026</td>
                    <td className="p-4 font-bold text-gray-900">₦450,000</td>
                    <td className="p-4">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Unpaid</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-blue-600">
                        <FileText className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
