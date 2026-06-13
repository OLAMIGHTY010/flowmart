import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ShieldCheck, Download, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { userServices } from "@/services/UserServices";

export default function PrivacySecurity() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  
  const [toggles, setToggles] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility ?? true,
    showOnlineStatus: user?.privacySettings?.showOnlineStatus ?? false,
    locationTracking: user?.privacySettings?.locationTracking ?? true,
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: (newSettings: typeof toggles) => userServices.updatePrivacySettings(newSettings),
    onSuccess: (data) => {
      // Update local storage to persist the UI state locally
      if (user) {
        const updatedUser = { ...user, privacySettings: data.data?.privacySettings || data.privacySettings };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => userServices.deleteAccount(),
    onSuccess: () => {
      logout();
      navigate("/login");
    }
  });

  const handleToggle = (key: keyof typeof toggles) => {
    const newSettings = { ...toggles, [key]: !toggles[key] };
    setToggles(newSettings);
    if (user?.id) {
      updatePrivacyMutation.mutate(newSettings);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:max-w-none md:px-0 md:py-0">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 md:text-2xl">Privacy & Security</h1>
      </div>

      <div className="space-y-8">
        {/* SECURITY SECTION */}
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Security
          </h2>
          <div className="space-y-2">
            <Link to="/change-password" className="flex w-full items-center justify-between rounded-xl bg-white p-4 transition hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer block">
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Change Password</p>
                <p className="mt-0.5 text-xs text-gray-500">Last changed 30 days ago</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            <Link to="/two-factor-auth" className="flex w-full items-center justify-between rounded-xl bg-white p-4 transition hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer block">
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Two-Factor Authentication</p>
                <p className="mt-0.5 text-xs text-gray-500">Add extra login security</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>

            <Link to="/active-sessions" className="flex w-full items-center justify-between rounded-xl bg-white p-4 transition hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer block">
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Active Sessions</p>
                <p className="mt-0.5 text-xs text-gray-500">2 devices logged in</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          </div>

          {/* 2FA Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-green-100 p-4 border border-green-200 cursor-pointer hover:bg-green-200/70 transition">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-green-900">Enable 2FA</p>
                <p className="text-xs font-medium text-green-700">Protect your account...</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-800">Set up now →</span>
          </div>
        </section>

        {/* PRIVACY SECTION */}
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Privacy
          </h2>
          <div className="space-y-4 rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Profile Visibility</p>
              <button
                onClick={() => handleToggle("profileVisibility")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  toggles.profileVisibility ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    toggles.profileVisibility ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Show Online Status</p>
              <button
                onClick={() => handleToggle("showOnlineStatus")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  toggles.showOnlineStatus ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    toggles.showOnlineStatus ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Location Tracking</p>
              <button
                onClick={() => handleToggle("locationTracking")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  toggles.locationTracking ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    toggles.locationTracking ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* DATA SECTION */}
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Data
          </h2>
          <div className="space-y-2">
            <button className="flex w-full items-center justify-between rounded-xl bg-white p-4 transition hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">Download My Data</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
            <button 
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
              className="flex w-full items-center justify-between rounded-xl bg-white p-4 transition hover:bg-red-50 border border-gray-100 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {deleteAccountMutation.isPending ? (
                  <Loader2 size={18} className="text-red-500 animate-spin" />
                ) : (
                  <Trash2 size={18} className="text-red-500" />
                )}
                <span className="text-sm font-semibold text-red-600">Delete Account</span>
              </div>
              <ChevronRight size={18} className="text-red-400" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
