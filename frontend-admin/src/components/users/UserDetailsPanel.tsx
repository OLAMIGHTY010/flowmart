import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { UserManagementServices, type User } from '@/services/UserManagementServices';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserDetailsPanelProps {
  user: User;
  onClose: () => void;
  onStatusChange: (id: string, status: 'active' | 'suspended' | 'deleted') => Promise<void>;
  onRefresh?: () => void;
}

const ALL_PERMISSIONS = ['View Reports', 'Approve Vendors', 'Manage Welfare', 'Export Data'];

export default function UserDetailsPanel({ user, onClose, onStatusChange, onRefresh }: UserDetailsPanelProps) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isActive, setIsActive] = useState(user.status === 'active');
  
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState(user.role);
  
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    (user.role === 'super_admin' || user.role === 'admin') ? ALL_PERMISSIONS : []
  );

  const isCurrentSuperAdmin = (currentUser as any)?.role === 'super_admin';
  const isAdmin = (currentUser as any)?.role === 'admin';
  const isTargetSuperAdmin = user.role === 'super_admin';

  // Only super admin can edit other admins
  const canEdit = isCurrentSuperAdmin;
  
  // Block actions if current user is Admin AND target is Super Admin
  const isActionBlocked = (isAdmin && isTargetSuperAdmin);

  const getRoleBadgeColor = (r: string) => {
    if (r === 'super_admin') return 'bg-purple-100 text-purple-700';
    if (r === 'admin') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = (r: string) => {
    return r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleToggleStatus = async () => {
    if (isActionBlocked || isTargetSuperAdmin) return;
    const newStatus = isActive ? 'suspended' : 'active';
    setIsUpdating(true);
    try {
      await onStatusChange(user.id, newStatus);
      setIsActive(!isActive);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isActionBlocked || isTargetSuperAdmin) return;
    if (confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      setIsUpdating(true);
      try {
        await onStatusChange(user.id, 'deleted');
        onClose();
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      onClose();
      return;
    }
    
    setIsUpdating(true);
    try {
      await UserManagementServices.updateUser(user.id, {
        fullName,
        email,
        phone,
        role
      });
      showToast("User details updated successfully", "success");
      if (onRefresh) onRefresh();
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update user", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePermissionToggle = (perm: string) => {
    if (!canEdit) return;
    setSelectedPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 text-lg">User Details</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar flex flex-col gap-6">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {fullName.charAt(0).toUpperCase()}
            </div>
            {isActive && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-success rounded-full border-2 border-white"></div>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-lg mt-3">{fullName}</h3>
          <p className="text-sm text-slate-500 mb-2">{email}</p>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeColor(role)}`}>
            {getRoleLabel(role)}
          </span>
        </div>

        {/* Info Form */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)}
              readOnly={!canEdit} 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${canEdit ? 'border-slate-300 bg-white focus:border-green-500' : 'border-slate-200 bg-slate-50 text-slate-700'}`} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              readOnly={!canEdit} 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${canEdit ? 'border-slate-300 bg-white focus:border-green-500' : 'border-slate-200 bg-slate-50 text-slate-700'}`} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="Not provided"
              readOnly={!canEdit} 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${canEdit ? 'border-slate-300 bg-white focus:border-green-500' : 'border-slate-200 bg-slate-50 text-slate-700'}`} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Role</label>
            {canEdit ? (
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:border-green-500 outline-none"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="zone_coordinator">Zone Coordinator</option>
                <option value="camp_logistics_coordinator">Camp Logistics</option>
                <option value="vendor">Vendor</option>
                <option value="dispatch_rider">Rider</option>
                <option value="attendee">Attendee</option>
              </select>
            ) : (
              <input type="text" value={getRoleLabel(role)} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 outline-none" />
            )}
          </div>
        </div>

        {/* Account Status Toggle */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="font-bold text-slate-800 text-sm">Account Status</p>
            <p className="text-xs text-slate-500">Currently {isActive ? 'active' : 'suspended'}</p>
          </div>
          <button 
            disabled={isActionBlocked || isTargetSuperAdmin || isUpdating}
            onClick={handleToggleStatus}
            className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-success' : 'bg-slate-300'} ${(isActionBlocked || isTargetSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Permissions */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Permissions</label>
          <div className="flex flex-col gap-3">
            {ALL_PERMISSIONS.map(perm => (
              <label key={perm} className={`flex items-center gap-3 ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedPermissions.includes(perm)} 
                  onChange={() => handlePermissionToggle(perm)}
                  disabled={!canEdit} 
                  className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500 disabled:opacity-60" 
                />
                <span className="text-sm text-slate-700 font-medium">{perm}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Meta Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col gap-2 text-sm mt-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Account Created</span>
            <span className="font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last Login</span>
            <span className="font-medium text-slate-800">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Sessions</span>
            <span className="font-medium text-slate-800">1,247</span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-white flex flex-col gap-3">
        <button 
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full py-2.5 bg-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isUpdating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
          {canEdit ? 'Save Changes' : 'Close'}
        </button>
        
        <button 
          onClick={handleToggleStatus}
          disabled={isActionBlocked || isTargetSuperAdmin || isUpdating}
          className="w-full py-2.5 bg-white border border-red-200 text-danger hover:bg-red-50 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActive ? 'Suspend Account' : 'Activate Account'}
        </button>
        
        <button 
          onClick={handleDelete}
          disabled={isActionBlocked || isTargetSuperAdmin || isUpdating}
          className="w-full py-2.5 bg-white border border-red-200 text-danger hover:bg-red-50 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete Account
        </button>
      </div>

    </div>
  );
}
