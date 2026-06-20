import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, TrendingUp, Activity, BarChart, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import FailedPayoutsPanel from '@/components/finance/FailedPayoutsPanel';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function FinanceDashboard() {
  const { user } = useAuth();
  const isFinance = user?.role === 'finance';
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts'>('overview');
  
  // Report state
  const [reportPeriod, setReportPeriod] = useState<string>('weekly');
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get(`${API_URL}/finance/reconciliation`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to load finance data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const generateReport = async () => {
    setLoadingReport(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_URL}/finance/report?period=${reportPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data.data);
    } catch (err) {
      console.error("Failed to generate report", err);
      alert("Failed to generate report");
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;
    
    // Simple CSV conversion
    const headers = ["Metric", "Value"];
    const rows = [
      ["Report Period", reportData.period],
      ["Date Generated", new Date(reportData.dateGenerated).toLocaleString()],
      ["Marketplace Volume", reportData.marketplace.totalTransactionVolume],
      ["Vendor Commission Revenue", reportData.marketplace.flowmartVendorCommissionRevenue],
      ["Total Deliveries", reportData.logistics.totalDeliveries],
      ["Logistics Revenue", reportData.logistics.flowmartLogisticsRevenue],
      ["Rider Payouts", reportData.logistics.totalRiderPayouts],
      ["Total Platform Revenue", reportData.totalPlatformRevenue],
      ["Active Escrow Liability", reportData.marketplace.totalActiveEscrowLiability],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finance_report_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isFinance) {
    return <div className="p-6">You do not have permission to view the Finance Dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance & Audit Dashboard</h1>
          <p className="text-sm text-slate-500">Live Escrow Reconciliation & Reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={reportPeriod} 
            onChange={(e) => setReportPeriod(e.target.value)}
            className="border-slate-300 rounded-md text-sm p-2 shadow-sm focus:ring-brand-primary"
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
          <button 
            onClick={generateReport}
            disabled={loadingReport}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            {loadingReport ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button 
              onClick={downloadCSV}
              className="bg-brand-primary text-white px-4 py-2 rounded shadow hover:bg-green-600 transition text-sm font-bold flex items-center gap-2"
            >
              <BarChart size={16} />
              Download CSV
            </button>
          )}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {reportData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-primary/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">Visual Audit Report</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">Period: {reportPeriod} | Generated: {new Date(reportData.dateGenerated).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Platform Revenue</p>
                  <p className="text-2xl font-black text-brand-navy">₦{reportData.totalPlatformRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-2">Combined Commission & Delivery</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Marketplace Volume</p>
                  <p className="text-2xl font-black text-slate-700">₦{reportData.marketplace.totalTransactionVolume.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Escrow Liability</p>
                  <p className="text-2xl font-black text-red-600">₦{reportData.marketplace.totalActiveEscrowLiability.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Platform Logistics Revenue" value={`₦${data?.logisticsPlatformRevenue?.toLocaleString() || 0}`} icon={Activity} />
        <StatCard title="Vendor Escrow (Pending)" value={`₦${data?.vendors?.totalPending?.toLocaleString() || 0}`} icon={Wallet} />
        <StatCard title="Vendor Escrow (Available)" value={`₦${data?.vendors?.totalAvailable?.toLocaleString() || 0}`} icon={TrendingUp} />
        <StatCard title="Total Vendor Earnings" value={`₦${data?.vendors?.totalEarned?.toLocaleString() || 0}`} icon={BarChart} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mt-8">
        <h2 className="text-lg font-bold mb-4">Escrow Ledger</h2>
        {loading ? (
          <p>Loading ledger...</p>
        ) : (
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full text-left whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600 text-sm">
                <th className="p-3">Metric</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium">Logistics Delivery Revenue</td>
                <td className="p-3">₦{data?.logisticsPlatformRevenue?.toLocaleString() || 0}</td>
                <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Collected</span></td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Pending Vendor Payouts</td>
                <td className="p-3">₦{data?.vendors?.totalPending?.toLocaleString() || 0}</td>
                <td className="p-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Locked in Escrow</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'payouts' && (
        <FailedPayoutsPanel />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="bg-green-100 p-3 rounded-lg">
        <Icon size={24} className="text-brand-primary" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
