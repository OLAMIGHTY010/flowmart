import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, AlertCircle, ShoppingBag, Store, Bike } from "lucide-react";
import { supabase } from "@/services/supabase";
import logo from "@/assets/flowmart.png";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "customer";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Derived content based on role
  const getRoleDetails = () => {
    switch (role) {
      case "vendor":
        return {
          title: "Sell on FlowMart",
          subtitle: "Create your vendor account to start selling.",
          icon: <Store className="text-primary w-6 h-6" />,
          color: "border-primary",
          bg: "bg-primary/10"
        };
      case "dispatch_rider":
        return {
          title: "Ride with FlowMart",
          subtitle: "Create your delivery account to start earning.",
          icon: <Bike className="text-green-500 w-6 h-6" />,
          color: "border-green-500",
          bg: "bg-green-500/10"
        };
      case "customer":
      default:
        return {
          title: "Join FlowMart",
          subtitle: "Sign in to buy and track your orders.",
          icon: <ShoppingBag className="text-primary w-6 h-6" />,
          color: "border-primary",
          bg: "bg-primary/10"
        };
    }
  };

  const details = getRoleDetails();

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            role: role
          }
        }
      });

      if (error) throw error;
      
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="FlowMart Logo" className="h-16 object-contain mb-6" />
          
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 border ${details.color} ${details.bg}`}>
            {details.icon}
          </div>

          <h1 className="text-3xl font-headings font-black text-foreground text-center">
            {details.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {details.subtitle}
          </p>
        </div>

        <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex gap-2 items-center font-semibold">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthLogin('apple')}
            disabled={loading}
            className="w-full bg-black border border-black text-white hover:bg-gray-900 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            Continue with Apple
          </button>

          <button
            onClick={() => handleOAuthLogin('microsoft')}
            disabled={loading}
            className="w-full bg-[#00a4ef] border border-[#00a4ef] text-white hover:bg-[#008bc8] flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h11v11H0z"/>
              <path fill="#f3f3f3" d="M12 0h11v11H12z"/>
              <path fill="#f3f3f3" d="M0 12h11v11H0z"/>
              <path fill="#f3f3f3" d="M12 12h11v11H12z"/>
            </svg>
            Continue with Microsoft
          </button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-bold uppercase tracking-widest">Or standard email</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <button
            onClick={() => navigate(`/auth/email?role=${role}`)}
            disabled={loading}
            className="w-full bg-muted border border-border text-foreground hover:bg-muted/80 flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Mail className="w-5 h-5 text-muted-foreground" />
            Continue with Email
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 px-4">
          By continuing, you agree to FlowMart's <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
