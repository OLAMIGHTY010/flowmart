import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, Clock, CheckCircle2, XCircle, 
  Edit3, Check, X
} from 'lucide-react';
import { VendorApprovalServices } from '@/services/VendorApprovalServices';
import type { VendorListItem } from '@/services/VendorApprovalServices';
import { useToast } from '@/hooks/use-toast';

export default function VendorApprovals() {
  const [activeStatus, setActiveStatus] = useState<string>('pending');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;



  const { data: stats } = useQuery({
    queryKey: ['vendorApprovalStats'],
    queryFn: VendorApprovalServices.getStats
  });

  const { data: vendorsList, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendorsList', activeStatus, activeCategory],
    queryFn: () => VendorApprovalServices.getVendors(activeStatus, activeCategory)
  });

  // Filter vendors locally by search
  const filteredVendors = (vendorsList || []).filter(v => 
    v.businessName?.toLowerCase().includes(search.toLowerCase()) || 
    v.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleStatusChange = (val: string) => {
    setActiveStatus(val);
    setCurrentPage(1);
  };
  const handleCategoryChange = (val: string) => {
    setActiveCategory(val);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto h-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings flex items-center gap-3">
            Vendor Approvals
            <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-xs font-bold border border-green-100 flex items-center gap-1">
              <CheckCircle2 size={14} /> 34 require review
            </span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review onboarding submissions, verify documents, and approve/reject vendors.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-success focus:ring-1 focus:ring-success"
            />
          </div>
          <button className="bg-success text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-colors">
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
          <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><Clock size={14} /> Status</div>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button 
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${activeStatus === s ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
          <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase">Category</div>
          {['all', 'food', 'logistics', 'medical', 'clothing'].map(c => (
            <button 
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-colors ${activeCategory === c ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 ml-auto">
          Last 30 days
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500">Pending Review</h3>
            <div className="p-2 bg-orange-50 text-orange-500 rounded-full"><Clock size={20} /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{stats?.pendingReview || 0}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Awaiting compliance verification</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500">Approved This Month</h3>
            <div className="p-2 bg-green-50 text-green-500 rounded-full"><CheckCircle2 size={20} /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{stats?.approvedThisMonth || 0}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Trusted vendors cleared</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500">Rejected</h3>
            <div className="p-2 bg-red-50 text-red-500 rounded-full"><XCircle size={20} /></div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-800">{stats?.rejected || 0}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Applications requiring resubmission</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        
        {/* Vendor Queue (Left) */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Vendor Queue</h2>
              <p className="text-xs text-slate-500 font-medium">Scroll through submissions and open a vendor for detailed review.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {filteredVendors.length} active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 hide-scrollbar pb-10">
            {vendorsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
                <div className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No vendors found matching criteria.</div>
            ) : activeStatus === 'all' || activeStatus === 'approved' ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Vendor Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVendors.map(vendor => (
                      <tr 
                        key={vendor.id}
                        onClick={() => setSelectedVendorId(vendor.id)}
                        className={`cursor-pointer transition-colors ${selectedVendorId === vendor.id ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 font-bold text-slate-800">{vendor.businessName || vendor.fullName}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">{vendor.category || 'Logistics'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded border capitalize ${
                            vendor.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                            vendor.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {vendor.status === 'pending' ? 'Pending Review' : vendor.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              paginatedVendors.map(vendor => (
                <VendorCard 
                  key={vendor.id} 
                  vendor={vendor} 
                  isSelected={selectedVendorId === vendor.id}
                  onClick={() => setSelectedVendorId(vendor.id)}
                />
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 mt-4">
                <span className="text-sm text-slate-500 font-medium">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredVendors.length)} of {filteredVendors.length}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-sm font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm font-bold text-slate-800 px-2">{currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 text-sm font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vendor Details Sidebar (Right) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0">
          {selectedVendorId ? (
            <VendorDetailsPanel 
              vendorId={selectedVendorId} 
              onClose={() => setSelectedVendorId(null)} 
            />
          ) : (
            <div className="h-full border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-blue-50/50">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No Vendor Selected</h3>
              <p className="text-sm text-slate-500 mt-2">Select a vendor from the queue to view their application details and compliance documents.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Subcomponents ---

function VendorCard({ vendor, isSelected, onClick }: { vendor: VendorListItem, isSelected: boolean, onClick: () => void }) {
  const isPending = vendor.status === 'pending';
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative p-5 rounded-2xl border transition-all cursor-pointer shadow-sm
        ${isSelected ? 'border-success bg-green-50/30 ring-1 ring-success ring-opacity-50' : 'border-slate-200 bg-white hover:border-slate-300'}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${isSelected ? 'bg-success' : 'bg-blue-200 text-blue-700'}`}>
            {vendor.logo}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{vendor.businessName || vendor.fullName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Submitted {new Date(vendor.createdAt).toLocaleDateString()} — Reg. No. {vendor.cacNo || 'N/A'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
            {vendor.category}
          </span>
          <span className={`px-2 py-1 text-[10px] font-bold rounded border ${
            isPending ? 'bg-orange-50 text-orange-600 border-orange-100' : 
            vendor.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
            'bg-red-50 text-red-600 border-red-100'
          }`}>
            {vendor.status === 'pending' ? 'Pending Review' : vendor.status}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance Score</span>
          <span className="text-xs font-bold text-slate-700">{vendor.complianceScore}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${vendor.complianceScore >= 80 ? 'bg-success' : vendor.complianceScore >= 50 ? 'bg-orange-400' : 'bg-red-500'}`} 
            style={{ width: `${vendor.complianceScore}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1 text-success"><Check size={14} /> CAC</span>
        <span className="flex items-center gap-1 text-success"><Check size={14} /> Tax</span>
        <span className="flex items-center gap-1 text-red-500"><X size={14} /> Insurance</span>
        <span className="flex items-center gap-1 text-orange-500"><Clock size={14} /> Health/Safety</span>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <button className="text-success text-sm font-bold flex items-center gap-1">
          <Edit3 size={14} /> Review
        </button>
        {isSelected && (
          <span className="bg-success text-white px-3 py-1 rounded text-xs font-bold">Selected</span>
        )}
      </div>
    </div>
  );
}

function VendorDetailsPanel({ vendorId, onClose }: { vendorId: string, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');
  const { showToast } = useToast();

  const { data: details, isLoading } = useQuery({
    queryKey: ['vendorDetails', vendorId],
    queryFn: () => VendorApprovalServices.getVendorDetails(vendorId)
  });

  const reviewMutation = useMutation({
    mutationFn: ({ status, notes }: { status: 'approved'|'rejected', notes: string }) => VendorApprovalServices.reviewVendor(vendorId, status, notes),
    onSuccess: (data) => {
      showToast(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: ['vendorsList'] });
      queryClient.invalidateQueries({ queryKey: ['vendorApprovalStats'] });
      queryClient.invalidateQueries({ queryKey: ['vendorDetails', vendorId] });
      onClose();
    },
    onError: () => {
      showToast("Failed to submit review", 'error');
    }
  });

  if (isLoading) return <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 animate-pulse">Loading details...</div>;
  if (!details) return null;

  const { user, profile, kyc, complianceScore, history } = details;

  return (
    <div className="h-full bg-white rounded-2xl border-2 border-blue-500 shadow-xl overflow-hidden flex flex-col relative">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full z-10 lg:hidden">
        <X size={20} />
      </button>

      <div className="flex-1 overflow-y-auto">
        {/* Panel Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded bg-green-100 text-success flex items-center justify-center font-bold text-xl shrink-0">
              {kyc.businessName?.charAt(0) || 'V'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{kyc.businessName}</h2>
              <p className="text-xs text-slate-500 mt-1">Vendor profile and compliance review</p>
            </div>
            <div className="ml-auto">
              <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">
                {kyc.status === 'pending' ? 'Pending Review' : kyc.status}
              </span>
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contact</p>
              <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
              <p className="text-xs text-slate-500 mt-1">{user.phone || 'N/A'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Business Details</p>
              <p className="text-sm font-bold text-slate-800">{profile?.category || 'Logistics'}</p>
              <p className="text-xs text-slate-500 mt-1">RC - {kyc.cacNo || 'N/A'}</p>
              <p className="text-xs text-slate-500">{profile?.city || 'N/A'}, {profile?.stateRegion || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-slate-800">Compliance Checklist</h3>
              <span className="text-xs text-slate-500">7 documents</span>
            </div>

            <div className="space-y-3">
              <ChecklistItem label="CAC Certificate" checked={!!kyc.cacNo} fileUrl={kyc.cacNo} />
              <ChecklistItem label="Tax Clearance" checked={false} />
              <ChecklistItem label="NAFDAC License" checked={!!kyc.nafdacCertificateCode} fileUrl={kyc.nafdacCertificateFile} />
              <ChecklistItem label="Insurance" checked={false} />
              <ChecklistItem label="CAMP Certificate" checked={!!kyc.campCertificateFile} fileUrl={kyc.campCertificateFile} />
              <ChecklistItem label="Guarantor ID" checked={!!kyc.guarantorIdFile} fileUrl={kyc.guarantorIdFile} />
              <ChecklistItem label="Vendor Logo/Image" checked={!!profile?.avatar} fileUrl={profile?.avatar} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-800">Compliance Score</p>
              <p className="text-[10px] text-slate-500 w-3/4">Based on submitted documents and verification status</p>
            </div>
            <div className="text-2xl font-black text-slate-800">{complianceScore}%</div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Edit3 size={16} /> Review Notes
            </h3>
            <textarea 
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about missing documents, verification concerns, or approval rationale..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-success focus:ring-1 focus:ring-success resize-none h-24"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              disabled={reviewMutation.isPending || kyc.status === 'approved'}
              onClick={() => reviewMutation.mutate({ status: 'approved', notes: reviewNotes })}
              className="flex-1 bg-success hover:bg-green-600 text-white py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={16} /> {kyc.status === 'approved' ? 'Approved' : 'Approve Vendor'}
            </button>
            <button 
              disabled={reviewMutation.isPending || kyc.status === 'approved'}
              onClick={() => reviewMutation.mutate({ status: 'rejected', notes: reviewNotes })}
              className="flex-1 bg-danger hover:bg-red-700 text-white py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={16} /> Reject Application
            </button>
          </div>

          <div className="border-t border-slate-100 pt-6 pb-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} /> Review History
            </h3>
            <div className="space-y-4">
              {history.map((item: any, i: number) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${item.action === 'approved' ? 'bg-success' : item.action === 'rejected' ? 'bg-danger' : 'bg-slate-300'}`}></div>
                    {i !== history.length - 1 && <div className="w-px h-full bg-slate-200 my-1"></div>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 capitalize">{item.action}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(item.createdAt).toLocaleString()} — {item.notes || 'System action'}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-success"></div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Initial submission received</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{new Date(kyc.createdAt).toLocaleString()} — System (vendor portal)</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, checked, fileUrl }: { label: string, checked: boolean, fileUrl?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {checked ? <CheckCircle2 size={16} className="text-success" /> : <div className="w-4 h-4 rounded-full border border-slate-300"></div>}
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {fileUrl && checked && (
          <a 
            href={fileUrl.startsWith('http') ? fileUrl : `https://flowmart-bucket.s3.amazonaws.com/${fileUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline uppercase"
          >
            View
          </a>
        )}
        <div className={`w-8 h-4 rounded-full flex items-center px-0.5 ${checked ? 'bg-success' : 'bg-slate-200'}`}>
          <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
      </div>
    </div>
  );
}
