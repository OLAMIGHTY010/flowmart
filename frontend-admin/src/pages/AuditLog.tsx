import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Calendar, Download, ChevronDown, ChevronRight, 
  ShieldAlert, CheckCircle2, XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuditLogServices } from '@/services/AuditLogServices';
import type { AuditLogItem } from '@/services/AuditLogServices';

export default function AuditLog() {
  const [activeTab, setActiveTab] = useState('All Events');
  const [search, setSearch] = useState('');
  const [dateRange] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, search, activeTab, dateRange],
    queryFn: () => AuditLogServices.getLogs(page, limit, search, activeTab, dateRange),
  });

  const handleExport = async () => {
    await AuditLogServices.downloadCsv(activeTab);
  };

  const tabs = ['All Events', 'User Actions', 'Vendor Changes', 'Platform Updates', 'System Errors', 'Security Alerts'];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">Audit Log</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review system activity and user events.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
            />
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Calendar size={16} /> Jun 1 - Jun 30, 2026 <ChevronDown size={14} />
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-success text-success hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-success text-success' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1 min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3 max-w-[300px]">Description</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">Loading logs...</td></tr>
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((log: AuditLogItem) => (
                  <LogTableRow 
                    key={log.id} 
                    log={log} 
                    isExpanded={expandedRow === log.id}
                    onToggle={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  />
                ))
              ) : (
                <tr><td colSpan={9} className="text-center py-10 text-slate-500">No logs found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-auto border-t border-slate-200 p-4 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500 font-medium">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} events
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm font-bold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <div className="flex gap-1">
                {[...Array(data.pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                      page === i + 1 ? 'bg-success text-white' : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                className="px-3 py-1 text-sm font-bold rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogTableRow({ log, isExpanded, onToggle }: { log: AuditLogItem, isExpanded: boolean, onToggle: () => void }) {
  const { showToast } = useToast();
  
  const handleFlagEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast("Event flagged for security review", "success");
  };

  const getActionColor = (action: string) => {
    switch(action.toLowerCase()) {
      case 'rejected': return 'text-danger bg-red-50';
      case 'approved': return 'text-success bg-green-50';
      case 'updated': return 'text-blue-600 bg-blue-50';
      case 'deleted': return 'text-danger bg-red-50';
      case 'created': return 'text-success bg-green-50';
      case 'login': return 'text-indigo-600 bg-indigo-50';
      case 'alert': return 'text-orange-600 bg-orange-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getModuleColor = (module: string) => {
    switch(module.toLowerCase()) {
      case 'onboard': return 'bg-teal-100 text-teal-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'auth': return 'bg-indigo-100 text-indigo-800';
      case 'profile': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      case 'platform': return 'bg-slate-200 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const isSystem = log.actorName === 'System';

  return (
    <>
      <tr 
        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 border-b-0' : ''}`} 
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-slate-400 hover:text-slate-700">
          <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            <ChevronRight size={16} />
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{new Date(log.createdAt).toLocaleDateString()}</span>
            <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.eventId}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isSystem ? 'bg-slate-800' : 'bg-success'}`}>
              {isSystem ? <ShieldAlert size={12} /> : log.actorName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-slate-800">{log.actorName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getActionColor(log.action)}`}>
            {log.action}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getModuleColor(log.module)}`}>
            {log.module}
          </span>
        </td>
        <td className="px-4 py-3 max-w-[300px] truncate text-slate-600" title={log.description}>
          {log.description}
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs font-mono">{log.ipAddress || '-'}</td>
        <td className="px-4 py-3">
          <div className={`flex items-center gap-1 text-xs font-bold ${log.status === 'Success' ? 'text-success' : 'text-danger'}`}>
            {log.status === 'Success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {log.status}
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="bg-slate-50 border-t-0">
          <td colSpan={9} className="px-12 py-4 pb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Event Details — {log.eventId}</h4>
                  <p className="text-xs text-slate-500 mt-1">Full description: {log.description}</p>
                </div>
                <button 
                  onClick={handleFlagEvent}
                  className="text-xs font-bold text-danger border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                >
                  <ShieldAlert size={12} /> Flag Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded p-4 border border-slate-100 font-mono text-xs">
                <div>
                  <p className="text-slate-400 font-bold mb-2 text-[10px] uppercase tracking-wider">Metadata / Payload</p>
                  {log.metadata ? (
                    <pre className="text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-slate-400 italic">No additional metadata attached.</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-400 font-bold mb-2 text-[10px] uppercase tracking-wider">Environment Context</p>
                  <p className="text-slate-700 mb-1"><span className="text-slate-500">IP Address:</span> {log.ipAddress || 'Unknown'}</p>
                  <p className="text-slate-700 mb-1"><span className="text-slate-500">Actor ID:</span> {log.actorId || 'System Process'}</p>
                  <p className="text-slate-700 mb-1"><span className="text-slate-500">Timestamp:</span> {log.createdAt}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
