import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Lock, 
  Download, 
  Edit3 
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  
  // States for toggles
  const [notifications, setNotifications] = useState({
    zoneDispatch: true,
    riderCheckIn: true,
    csvImport: true,
    dailySummary: false,
    systemMaintenance: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Helper for Toggle Switch
  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-[#0ca948]' : 'bg-slate-200'}`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and notification settings.</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-6">
          <User className="text-[#0ca948]" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Profile Information</h3>
            <p className="text-xs text-slate-500">Update your personal details visible to your team.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(user?.fullName)}
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Avatar</span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue={user?.fullName || ''}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  defaultValue={user?.email || ''}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-lg focus:outline-none px-3 py-2 pr-10 cursor-not-allowed"
                />
                <Lock size={14} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Managed by Super Admin.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Branch</label>
              <input 
                type="text" 
                defaultValue="FlowMart Logistics"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:outline-none px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <div className="relative">
                <input 
                  type="text" 
                  defaultValue={user?.role?.replace(/_/g, ' ') || 'Coordinator'}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-lg focus:outline-none px-3 py-2 pr-10 cursor-not-allowed capitalize"
                />
                <Lock size={14} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Read-only Assigned by Super Admin.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="bg-[#0ca948] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-6">
          <Bell className="text-[#0ca948]" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Notification Preferences</h3>
            <p className="text-xs text-slate-500">Choose which alerts and updates you receive.</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="flex justify-between items-center pt-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Zone Dispatch Alerts</h4>
              <p className="text-[10px] text-slate-500">Notify me when a zone dispatch is updated</p>
            </div>
            <Switch checked={notifications.zoneDispatch} onChange={() => toggleNotification('zoneDispatch')} />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Rider Check-in Alerts</h4>
              <p className="text-[10px] text-slate-500">Notify me when a rider checks in or goes offline</p>
            </div>
            <Switch checked={notifications.riderCheckIn} onChange={() => toggleNotification('riderCheckIn')} />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">CSV Import Completion</h4>
              <p className="text-[10px] text-slate-500">Notify me when a bulk CSV import finishes</p>
            </div>
            <Switch checked={notifications.csvImport} onChange={() => toggleNotification('csvImport')} />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Daily Summary Report</h4>
              <p className="text-[10px] text-slate-500">Receive a daily digest of distribution activity at 8:00 AM</p>
            </div>
            <Switch checked={notifications.dailySummary} onChange={() => toggleNotification('dailySummary')} />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">System Maintenance Alerts</h4>
              <p className="text-[10px] text-slate-500">Receive alerts about scheduled downtimes or updates</p>
            </div>
            <Switch checked={notifications.systemMaintenance} onChange={() => toggleNotification('systemMaintenance')} />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-6">
          <Shield className="text-[#0ca948]" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Security</h3>
            <p className="text-xs text-slate-500">Manage your password and active login sessions.</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="flex justify-between items-center pt-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
              <p className="text-[10px] text-slate-500">Last changed 45 days ago</p>
            </div>
            <button className="flex items-center gap-1 text-[10px] font-bold text-[#0ca948] hover:underline">
              <Edit3 size={12} /> Update Password
            </button>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Active Sessions</h4>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 
                Chrome on Windows Lagos, Nigeria Active now
              </p>
            </div>
            <button className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline">
              Sign out of this session
            </button>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-3 mb-6">
          <Database className="text-[#0ca948]" size={20} />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Data & Privacy</h3>
            <p className="text-xs text-slate-500">Access and manage your personal activity data.</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Export My Activity Log</h4>
            <p className="text-[10px] text-slate-500">Includes dispatch logs, zone edits, and login history for the past 90 days.</p>
          </div>
          <button className="flex items-center gap-1 text-[10px] font-bold text-[#0ca948] hover:underline">
            <Download size={12} /> Download CSV
          </button>
        </div>
      </div>

    </div>
  );
}
