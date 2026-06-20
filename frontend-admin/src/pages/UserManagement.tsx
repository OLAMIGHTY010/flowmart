import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  UserX,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { UserManagementServices, type User } from '@/services/UserManagementServices';
import { useAuth } from '@/hooks/useAuth';
import AddUserModal from '@/components/users/AddUserModal';
import UserDetailsPanel from '@/components/users/UserDetailsPanel';
import { useToast } from '@/hooks/use-toast';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'attendee' | 'vendor' | 'dispatch_rider' | 'pending' | 'suspended' | 'admins'>('attendee');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminUsersStats'],
    queryFn: UserManagementServices.getStats
  });

  // Map the tab state to API parameters
  let roleFilter = 'all';
  let statusFilter = 'all';

  if (activeTab === 'attendee') roleFilter = 'attendee';
  else if (activeTab === 'vendor') roleFilter = 'vendor';
  else if (activeTab === 'dispatch_rider') roleFilter = 'dispatch_rider';
  else if (activeTab === 'admins') roleFilter = 'admins';
  else if (activeTab === 'pending') {
    // We handle pending by asking for all roles but status=pending 
    // (though in our current basic impl we just do status=pending)
    statusFilter = 'pending';
  }
  else if (activeTab === 'suspended') {
    statusFilter = 'suspended';
  }

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', page, roleFilter, statusFilter, search],
    queryFn: () => UserManagementServices.getUsers(page, 10, roleFilter, statusFilter, search)
  });

  const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'deleted') => {
    try {
      await UserManagementServices.updateStatus(userId, status);
      showToast(`User account ${status} successfully.`, "success");
      refetchUsers();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update user status.", "error");
      throw error;
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">Super Admin</span>;
      case 'admin': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">Admin</span>;
      case 'vendor': return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">Vendor</span>;
      case 'dispatch_rider': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">Rider</span>;
      case 'attendee': return <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Attendee</span>;
      case 'zone_coordinator': return <span className="px-2 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full">Zone Coord</span>;
      case 'camp_logistics_coordinator': return <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-full">Logistics</span>;
      case 'finance': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Finance</span>;
      case 'auditor': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">Auditor</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <span className="text-green-600 font-bold text-xs bg-green-50 px-2.5 py-1 rounded-md border border-green-100">Active</span>;
      case 'suspended': return <span className="text-red-600 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-md border border-red-100">Suspended</span>;
      case 'pending': return <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">Pending</span>;
      default: return <span className="text-slate-600 font-bold text-xs">{status}</span>;
    }
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Never';
    
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-headings">User Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage platform users, roles and permissions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]"
            />
          </div>
          {isSuperAdmin && (
            <button 
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 bg-[#16a34a] hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              <UserPlus size={16} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</h3>
            {statsLoading ? (
               <div className="h-10 w-24 bg-slate-100 animate-pulse rounded mt-2"></div>
            ) : (
              <>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 font-headings">{(stats?.totalUsers || 0).toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-400 mt-2">+{stats?.newThisMonth} this month</p>
              </>
            )}
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</h3>
            {statsLoading ? (
               <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
            ) : (
              <>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 font-headings">{stats?.pendingApprovals}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">
                  Needs Review
                </div>
              </>
            )}
          </div>
          <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
            <Clock size={24} />
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm flex justify-between items-start">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Suspended Accounts</h3>
            {statsLoading ? (
               <div className="h-10 w-16 bg-slate-100 animate-pulse rounded mt-2"></div>
            ) : (
              <>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 font-headings">{stats?.suspendedAccounts}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">
                  Action Required
                </div>
              </>
            )}
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-lg">
            <UserX size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'attendee' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('attendee'); setPage(1);}}
          >
            All Users (Attendees)
          </button>
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'vendor' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('vendor'); setPage(1);}}
          >
            Vendors
          </button>
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'dispatch_rider' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('dispatch_rider'); setPage(1);}}
          >
            Riders
          </button>
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'pending' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('pending'); setPage(1);}}
          >
          Active Admins
            {stats?.pendingApprovals ? <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px]">{stats.pendingApprovals}</span> : null}
          </button>
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'suspended' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('suspended'); setPage(1);}}
          >
            Suspended
            {stats?.suspendedAccounts ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px]">{stats.suspendedAccounts}</span> : null}
          </button>
          <button 
            className={`px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'admins' ? 'border-[#16a34a] text-[#16a34a]' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            onClick={() => {setActiveTab('admins'); setPage(1);}}
          >
            Admins
          </button>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-[#16a34a] focus:ring-[#16a34a]" />
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Login</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : usersData?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-medium">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                usersData?.data.map((user: User) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-5 py-3.5">
                      <input type="checkbox" className="rounded border-slate-300 text-[#16a34a] focus:ring-[#16a34a]" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#16a34a] text-white flex items-center justify-center font-bold text-sm">
                          {user.fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                      {timeAgo(user.lastLogin)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-white text-sm">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>Rows per page:</span>
            <select className="border border-slate-200 rounded px-2 py-1 outline-none text-slate-700">
              <option>10</option>
              <option>20</option>
            </select>
            <span className="ml-4">
              Showing {((page - 1) * 10) + (usersData?.data.length ? 1 : 0)}–{Math.min(page * 10, usersData?.meta.totalItems || 0)} of {usersData?.meta.totalItems || 0} users
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium mr-2">Page {page} of {usersData?.meta.totalPages || 1}</span>
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded bg-[#16a34a] text-white font-bold text-xs">
                {page}
              </button>
              {/* Ellipsis placeholder if many pages */}
              {usersData?.meta.totalPages && usersData.meta.totalPages > page && (
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
                >
                  {page + 1}
                </button>
              )}
            </div>
            <button 
              disabled={!usersData || page >= usersData.meta.totalPages}
              onClick={() => setPage(p => Math.min(usersData?.meta.totalPages || 1, p + 1))}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} />

      {/* Slide-out User Details Panel */}
      {selectedUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedUser(null)}
          />
          <UserDetailsPanel 
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onStatusChange={handleStatusChange}
            onRefresh={refetchUsers}
          />
        </>
      )}
    </div>
  );
}
