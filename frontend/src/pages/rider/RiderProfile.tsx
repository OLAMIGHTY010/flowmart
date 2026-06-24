import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { User, Mail, Phone, LogOut, Save, Calendar, Users, Lock, Key, ShieldCheck, Smartphone, Settings, MapPin, Bell, HelpCircle, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { apiClient } from "@/services/api";

const RiderProfile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeView, setActiveView] = useState<'menu' | 'edit' | 'privacy'>('menu');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
  });

  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem("privacySettings");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      profileVisibility: user?.privacySettings?.profileVisibility ?? true,
      showOnlineStatus: user?.privacySettings?.showOnlineStatus ?? false,
      locationTracking: user?.privacySettings?.locationTracking ?? true,
    };
  });

  const handleToggle = (key: keyof typeof toggles) => {
    const newSettings = { ...toggles, [key]: !toggles[key] };
    setToggles(newSettings);
    localStorage.setItem("privacySettings", JSON.stringify(newSettings));
    showToast("Privacy settings updated successfully", "success");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.put("/users/profile", {
        fullName: formData.fullName,
        phone: formData.phone,
      });
      showToast("Profile updated successfully", "success");
      refreshUser();
      setActiveView('menu');
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { label: "Edit Profile", icon: User, action: () => setActiveView('edit') },
    { label: "Notifications", icon: Bell, action: () => showToast("🔔 New delivery request assigned to you! Check your dashboard.", "success") },
    { label: "Privacy & Security", icon: Lock, action: () => setActiveView('privacy') },
    { label: "My Zones", icon: MapPin, action: () => showToast("My Zones coming soon", "info") },
    { label: "Help & Support", icon: HelpCircle, action: () => showToast("Help & Support coming soon", "info") },
    { label: "Terms of Service", icon: FileText, action: () => showToast("Terms of Service coming soon", "info") },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-[70vh] font-body">
      <div className="max-w-4xl mx-auto bg-white md:rounded-3xl md:shadow-sm md:border md:border-gray-100 overflow-hidden">

        <div className="flex flex-col md:flex-row gap-8 px-4 md:px-8 pb-8">
          
          {/* LEFT COLUMN: Profile Card */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-[#e6f8ec] rounded-2xl p-6 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl font-bold text-primary mb-4 shadow-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || "U"
                )}
              </div>
              
              <h2 className="text-lg font-extrabold text-gray-900 mb-1 text-center">
                {user?.fullName || "Martha Johnson"}
              </h2>
              <p className="text-xs text-gray-500 mb-3 text-center">
                {user?.email || "martha@email.com"}
              </p>
              
              <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold mb-4">
                <MapPin size={14} /> Zone A1 Rider
              </div>

              <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-wide">Verified Account</span>
              </div>
            </div>

            {/* Logout button moved to bottom of left column on desktop */}
            <div className="hidden md:block mt-6">
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-red-500 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Dynamic Content Area */}
          <div className="flex-1 flex flex-col">
            
            {/* VIEW: MENU */}
            {activeView === 'menu' && (
              <div className="flex flex-col">
                {menuItems.map((item, index) => (
                  <div key={item.label} className="flex flex-col">
                    <button 
                      onClick={item.action}
                      className="flex items-center justify-between py-4 bg-transparent border-none cursor-pointer w-full text-left hover:bg-gray-50 transition-colors px-2 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
                          <item.icon size={20} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    {index < menuItems.length - 1 && (
                      <hr className="border-0 border-t border-gray-100 my-1 mx-2" />
                    )}
                  </div>
                ))}

                {/* Mobile logout button */}
                <div className="md:hidden mt-8 mb-4">
                  <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-red-500 text-red-500 text-sm font-bold cursor-pointer"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>
            )}

            {/* VIEW: EDIT PROFILE */}
            {activeView === 'edit' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-6 px-2">
                  <button onClick={() => setActiveView('menu')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer border-none">
                    <ArrowLeft size={20} className="text-gray-700" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 m-0">Edit Profile</h2>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <form onSubmit={handleSave} className="flex flex-col gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <User size={16} /> Full Name
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Mail size={16} /> Email Address <span className="text-xs font-normal text-gray-400">(Read-only)</span>
                      </label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                        value={user?.email || ""}
                        disabled
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Phone size={16} /> Phone Number
                      </label>
                      <input 
                        type="tel" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+234..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Users size={16} /> Gender
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed capitalize text-sm"
                          value={user?.gender || "Not specified"}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Calendar size={16} /> Date of Birth
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                          value={user?.dateOfBirth || "Not specified"}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer border-none" disabled={isSubmitting}>
                        <Save size={18} />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW: PRIVACY & SECURITY */}
            {activeView === 'privacy' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-6 px-2">
                  <button onClick={() => setActiveView('menu')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer border-none">
                    <ArrowLeft size={20} className="text-gray-700" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 m-0">Privacy & Security</h2>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-6">
                  
                  {/* Toggles */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Location Tracking</p>
                      <p className="text-xs text-gray-500">Allow FlowMart to track location for delivery matching</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("locationTracking")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer border-none ${toggles.locationTracking ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles.locationTracking ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <hr className="border-0 border-t border-gray-100 m-0" />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Profile Visibility</p>
                      <p className="text-xs text-gray-500">Make profile details visible to potential clients</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("profileVisibility")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer border-none ${toggles.profileVisibility ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles.profileVisibility ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <hr className="border-0 border-t border-gray-100 m-0" />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Show Online Status</p>
                      <p className="text-xs text-gray-500">Show when you are active on the application</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("showOnlineStatus")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer border-none ${toggles.showOnlineStatus ? "bg-primary" : "bg-gray-200"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles.showOnlineStatus ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>

                  <hr className="border-0 border-t border-gray-100 m-0" />

                  {/* Quick Actions Links */}
                  <div className="flex flex-col gap-3 mt-2">
                    <Link to="/two-factor-auth" className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm font-bold hover:bg-gray-50 transition-colors no-underline">
                      <ShieldCheck size={16} /> Two-Factor Authentication
                    </Link>
                    <Link to="/active-sessions" className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-gray-200 text-gray-900 text-sm font-bold hover:bg-gray-50 transition-colors no-underline">
                      <Smartphone size={16} /> Active Sessions
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderProfile;
