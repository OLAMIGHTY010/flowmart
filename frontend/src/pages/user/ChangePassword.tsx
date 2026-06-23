import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { UserInput } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { userServices } from "@/services/UserServices";

export default function ChangePassword() {
  const navigate = useNavigate();
  useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (pwd: string) => userServices.updatePassword(pwd),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/privacy-security"), 2000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    
    // In a real app, the backend verifies currentPassword. 
    // Here we just mock it (or check against stored password if available).
    // For json-server simulation, we'll assume it's correct to proceed.
    changePasswordMutation.mutate(newPassword);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Change Password</h1>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-blue-50 p-4 border border-blue-100">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Password Requirements</p>
            <p className="mt-0.5 text-xs text-blue-700">Must be at least 8 characters long and contain a number.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-600">
            Password successfully updated! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <UserInput
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <hr className="my-2 border-gray-100" />
          <UserInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <UserInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={changePasswordMutation.isPending || success}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-green-700 disabled:bg-green-400 cursor-pointer"
          >
            {changePasswordMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
