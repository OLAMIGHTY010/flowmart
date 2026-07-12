import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminServices, type VendorKYC } from "@/services/AdminServices";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Eye, AlertCircle, FileText, ChevronRight, Store } from "lucide-react";

export default function AdminVendorKYC() {
  const queryClient = useQueryClient();
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");

  const { data: vendorsData, isLoading } = useQuery({
    queryKey: ["admin", "vendors", filter],
    queryFn: () => adminServices.getVendorsList(filter)
  });

  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ["admin", "vendorDetails", selectedVendor],
    queryFn: () => adminServices.getVendorDetails(selectedVendor!),
    enabled: !!selectedVendor
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string, status: 'approved' | 'rejected', notes?: string }) => 
      adminServices.reviewVendor(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
      setSelectedVendor(null);
      alert("Vendor KYC reviewed successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Failed to review vendor");
    }
  });

  const handleReview = (status: 'approved' | 'rejected') => {
    if (!selectedVendor) return;
    
    let notes = "";
    if (status === 'rejected') {
      notes = prompt("Please provide a reason for rejection:") || "";
      if (!notes) return; // Cancelled
    }

    if (window.confirm(`Are you sure you want to mark this vendor as ${status.toUpperCase()}?`)) {
      reviewMutation.mutate({ id: selectedVendor, status, notes });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14}/> Approved</span>;
      case 'rejected': return <span className="px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Rejected</span>;
      case 'pending':
      case 'under_review': return <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14}/> Pending</span>;
      default: return <span className="px-3 py-1 bg-secondary text-text-secondary rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const vendors = vendorsData?.data || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendor Approvals</h1>
          <p className="text-text-secondary text-sm mt-1">Review and manage vendor KYC applications</p>
        </div>

        <div className="flex bg-surface border border-border p-1 rounded-xl">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : vendors.length === 0 ? (
        <div className="text-center p-12 bg-surface border border-border rounded-2xl">
          <AlertCircle size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-bold">No Vendors Found</h3>
          <p className="text-text-secondary">There are no vendor applications matching this filter.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-text-secondary text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Business Name</th>
                  <th className="px-6 py-4 font-semibold">Owner</th>
                  <th className="px-6 py-4 font-semibold">Submitted Date</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {v.logo}
                      </div>
                      {v.businessName || "Unnamed Business"}
                    </td>
                    <td className="px-6 py-4">
                      <div>{v.fullName}</div>
                      <div className="text-xs text-text-muted">{v.email}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {format(new Date(v.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${v.complianceScore >= 80 ? 'bg-green-500' : v.complianceScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v.complianceScore}%` }} />
                        </div>
                        <span className="text-xs font-bold">{v.complianceScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(v.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedVendor(v.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 ml-auto font-medium text-xs"
                      >
                        <Eye size={16} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {!!selectedVendor && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6 border-b border-border sticky top-0 bg-background z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={20} className="text-primary"/> Vendor Application Review
            </h2>
            <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-muted rounded-full">
              <XCircle size={20} className="text-muted-foreground" />
            </button>
          </div>
          
          <div className="p-6">
          {detailsLoading || !detailsData ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-6">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                  <h3 className="font-bold mb-3 flex items-center gap-2 border-b border-border pb-2"><Store size={16}/> Business Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-text-muted">Business Name:</span> <span className="font-medium">{detailsData.data.kyc.businessName}</span></p>
                    <p><span className="text-text-muted">CAC Number:</span> <span className="font-medium">{detailsData.data.kyc.cacNo || 'N/A'}</span></p>
                    <p><span className="text-text-muted">Business Address:</span> <span className="font-medium">{detailsData.data.kyc.businessAddress || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="bg-secondary/30 p-4 rounded-xl border border-border">
                  <h3 className="font-bold mb-3 flex items-center gap-2 border-b border-border pb-2"><CheckCircle2 size={16}/> Owner Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-text-muted">Full Name:</span> <span className="font-medium">{detailsData.data.user.fullName}</span></p>
                    <p><span className="text-text-muted">Email:</span> <span className="font-medium">{detailsData.data.user.email}</span></p>
                    <p><span className="text-text-muted">Phone:</span> <span className="font-medium">{detailsData.data.user.phone || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-surface border border-border p-4 rounded-xl shadow-xs">
                  <h3 className="font-bold mb-3 border-b border-border pb-2">Uploaded Documents</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Government ID</p>
                      {detailsData.data.kyc.governmentIdFile ? (
                        <a href={detailsData.data.kyc.governmentIdFile} target="_blank" rel="noreferrer" className="block w-full h-32 bg-secondary rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity">
                          <img src={detailsData.data.kyc.governmentIdFile} alt="Gov ID" className="w-full h-full object-cover" />
                        </a>
                      ) : <p className="text-sm text-red-500 font-medium">Missing</p>}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-text-muted mb-1">Business License / CAC Cert</p>
                      {detailsData.data.kyc.businessLicenseFile ? (
                        <a href={detailsData.data.kyc.businessLicenseFile} target="_blank" rel="noreferrer" className="block w-full h-32 bg-secondary rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity">
                          <img src={detailsData.data.kyc.businessLicenseFile} alt="License" className="w-full h-full object-cover" />
                        </a>
                      ) : <p className="text-sm text-red-500 font-medium">Missing</p>}
                    </div>
                  </div>
                </div>

                {detailsData.data.kyc.status === 'pending' || detailsData.data.kyc.status === 'under_review' ? (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button 
                      onClick={() => handleReview('rejected')}
                      disabled={reviewMutation.isPending}
                      className="flex-1 py-3 bg-destructive/10 text-destructive font-bold rounded-xl hover:bg-destructive/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleReview('approved')}
                      disabled={reviewMutation.isPending}
                      className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Approve Vendor
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-secondary/50 rounded-xl flex justify-between items-center border border-border">
                    <span className="font-semibold text-sm">Current Status:</span>
                    {getStatusBadge(detailsData.data.kyc.status)}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
