import { useNavigate } from "react-router-dom";
import { Store, ShoppingBag, Bike, ShieldCheck } from "lucide-react";
import logo from "@/assets/flowmart.png";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="max-w-4xl w-full z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-12 animate-in slide-in-from-bottom-5 fade-in duration-700">
          <div className="w-20 h-20 bg-white rounded-2xl p-2 mb-4 shadow-xl">
            <img src={logo} alt="FlowMart" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white font-headings tracking-tight text-center">
            Welcome to <span className="text-primary">FlowMart</span>
          </h1>
          <p className="text-lg text-white/60 mt-4 text-center max-w-lg font-medium">
            The ultimate ecosystem for buyers, sellers, and delivery riders. How would you like to continue?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Customer / Buyer */}
          <div 
            onClick={() => navigate('/auth?role=customer')}
            className="group bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 p-8 rounded-3xl transition-all cursor-pointer flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-headings">Shop on FlowMart</h2>
            <p className="text-sm text-white/50 mb-6">Discover products from thousands of vendors with fast delivery.</p>
            <span className="text-primary/80 font-bold text-sm uppercase tracking-wider group-hover:underline mt-auto">Sign in as Customer</span>
          </div>

          {/* Vendor */}
          <div 
            onClick={() => navigate('/auth?role=vendor')}
            className="group bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 p-8 rounded-3xl transition-all cursor-pointer flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-200"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-headings">Sell on FlowMart</h2>
            <p className="text-sm text-white/50 mb-6">Open your Food, Store, or Clothes business and reach thousands of customers.</p>
            <span className="text-primary/80 font-bold text-sm uppercase tracking-wider group-hover:underline mt-auto">Become a Vendor</span>
          </div>

          {/* Delivery Rider */}
          <div 
            onClick={() => navigate('/auth?role=dispatch_rider')}
            className="group bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-white/10 p-8 rounded-3xl transition-all cursor-pointer flex flex-col items-center text-center animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Bike size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-headings">Ride with Us</h2>
            <p className="text-sm text-white/50 mb-6">Deliver orders and earn money on your own schedule.</p>
            <span className="text-green-400 font-bold text-sm uppercase tracking-wider group-hover:underline mt-auto">Join Delivery</span>
          </div>
        </div>

        {/* Admin Access Link */}
        <div className="mt-16 animate-in fade-in duration-1000 delay-500">
          <a href="http://localhost:5175" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm font-semibold">
            <ShieldCheck size={16} /> Admin / Customer Care Access
          </a>
        </div>
      </div>
    </div>
  );
}
