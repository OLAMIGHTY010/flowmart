import { useState } from "react";
import { Megaphone, Rocket, TrendingUp, DollarSign, CheckCircle } from "lucide-react";

export default function VendorMarketing() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mock Products
  const myProducts = [
    { id: "p1", name: "Sony Alpha A7III Camera", isSponsored: false },
    { id: "p2", name: "Apple MacBook Pro M3", isSponsored: true },
    { id: "p3", name: "Logitech MX Master 3", isSponsored: false },
  ];

  const tiers = [
    { days: 3, price: 2500, label: "Quick Boost", popular: false },
    { days: 7, price: 5000, label: "Weekly Special", popular: true },
    { days: 30, price: 15000, label: "Max Visibility", popular: false },
  ];

  const handleBoost = () => {
    setLoading(true);
    // Simulate API call to /marketing/boost
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-purple-600" /> Marketing & Ads
        </h1>
        <p className="text-gray-500 mt-1">Boost your products to the top of search results and homepage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Boost Form */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-gray-400" /> Create New Campaign
            </h3>
            
            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Product to Boost</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Choose a product --</option>
                  {myProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isSponsored ? "(Currently Boosted)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Duration</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {tiers.map((tier) => (
                    <div 
                      key={tier.days}
                      onClick={() => setSelectedTier(tier.days)}
                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${selectedTier === tier.days ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 inset-x-0 mx-auto w-max px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-full">
                          Most Popular
                        </div>
                      )}
                      <p className="text-sm font-bold text-gray-500 text-center">{tier.label}</p>
                      <h4 className="text-xl font-black text-gray-900 text-center my-1">{tier.days} Days</h4>
                      <p className="text-sm text-purple-600 font-bold text-center">₦{tier.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-gray-100">
                <button 
                  disabled={!selectedProduct || !selectedTier || loading}
                  onClick={handleBoost}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? "Processing Payment..." : success ? <><CheckCircle className="h-5 w-5" /> Boost Successful!</> : "Pay with Wallet & Boost"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Ad fees are automatically deducted from your Wallet Balance.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Stats & Active Campaigns */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
            <h3 className="font-bold opacity-90 mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Impressions Gained
            </h3>
            <p className="text-3xl font-black">45,280</p>
            <p className="text-sm opacity-80 mt-2">Across 2 active campaigns this week.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-md font-bold text-gray-900 mb-4">Active Campaigns</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">Apple MacBook Pro M3</p>
                  <p className="text-xs text-gray-500">Expires in 4 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
