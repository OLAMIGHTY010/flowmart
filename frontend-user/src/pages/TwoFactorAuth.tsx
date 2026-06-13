import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, ShieldCheck, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { userServices } from "@/services/UserServices";

export default function TwoFactorAuth() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(user?.twoFactorEnabled ?? false);

  const toggle2FAMutation = useMutation({
    mutationFn: (enabled: boolean) => userServices.toggleTwoFactor(enabled),
    onSuccess: (_, variables) => {
      if (user) {
        const updatedUser = { ...user, twoFactorEnabled: variables };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  });

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    toggle2FAMutation.mutate(newState);
  };

  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Two-Factor Auth</h1>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
          {isEnabled ? <ShieldCheck size={40} /> : <ShieldAlert size={40} />}
        </div>
        
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          {isEnabled ? "2FA is Enabled" : "Secure Your Account"}
        </h2>
        <p className="mb-8 text-sm text-gray-500 leading-relaxed">
          {isEnabled 
            ? "Your account is protected with an extra layer of security. We'll ask for a login code whenever you sign in from an unrecognized device."
            : "Two-factor authentication adds an extra layer of security to your account by requiring a verification code when you log in."}
        </p>

        {!isEnabled && (
          <div className="mb-8 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
            <Smartphone size={24} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">SMS Authentication</p>
              <p className="text-xs text-gray-500">We'll send a code to +234 801***5678</p>
            </div>
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={toggle2FAMutation.isPending}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50 ${
            isEnabled 
              ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100" 
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {toggle2FAMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isEnabled ? (
            "Disable 2FA"
          ) : (
            "Enable via SMS"
          )}
        </button>
      </div>
    </div>
  );
}
