import { useState, useEffect } from "react";
import { Users, Copy, Share2, Info, Gift, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Referrals() {
  const [stats, setStats] = useState({
    referralCode: "FM-WIN-2024",
    totalEarned: 2000,
    pendingRewards: 1000,
    totalInvited: 3
  });

  const [referrals, setReferrals] = useState([
    { id: 1, name: "Tunde O.", status: "completed", amount: 1000, date: "2024-10-01" },
    { id: 2, name: "Sarah A.", status: "completed", amount: 1000, date: "2024-10-02" },
    { id: 3, name: "Emeka U.", status: "pending", amount: 1000, date: "2024-10-02" },
  ]);

  const [copied, setCopied] = useState(false);
  const referralLink = `https://flowmart.com/signup?ref=${stats.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join FlowMart & Get ₦500',
        text: `Use my link to join FlowMart and get a ₦500 welcome bonus!`,
        url: referralLink,
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 bg-white/10 w-64 h-64 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-black mb-3">Invite Friends. Earn Wallet Credit.</h1>
            <p className="text-purple-100 text-lg mb-6">
              Give your friends a ₦500 welcome bonus. Once they make their first purchase, you'll earn ₦1,000 directly to your Wallet!
            </p>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-2 pl-4 rounded-xl w-full max-w-md">
              <span className="font-mono text-purple-100 truncate flex-1">{referralLink}</span>
              <button 
                onClick={copyToClipboard}
                className="bg-white text-purple-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
          <div className="hidden md:flex">
            <div className="bg-white/20 p-6 rounded-full border-4 border-white/30 backdrop-blur-sm">
              <Gift size={64} className="text-white drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500 font-bold">
            <Gift className="text-purple-600" size={20} />
            Total Earned
          </div>
          <h2 className="text-3xl font-black text-gray-900">₦{stats.totalEarned.toLocaleString()}</h2>
          <p className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1">
            <CheckCircle size={14} /> Credited to Wallet
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500 font-bold">
            <Clock className="text-orange-500" size={20} />
            Pending Rewards
          </div>
          <h2 className="text-3xl font-black text-gray-900">₦{stats.pendingRewards.toLocaleString()}</h2>
          <p className="text-sm text-gray-400 mt-2 font-medium flex items-center gap-1">
            <Info size={14} /> Unlocks after friend's first order
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-gray-500 font-bold">
            <Users className="text-blue-500" size={20} />
            Total Invited
          </div>
          <h2 className="text-3xl font-black text-gray-900">{stats.totalInvited} Friends</h2>
          <button onClick={shareLink} className="text-sm text-purple-600 hover:text-purple-700 mt-2 font-bold flex items-center gap-1 transition-colors">
            <Share2 size={14} /> Share via Social Media
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Referral History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {referrals.map((ref) => (
            <div key={ref.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 font-bold">
                  {ref.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{ref.name}</p>
                  <p className="text-sm text-gray-500">Joined {ref.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 mb-1">+₦{ref.amount.toLocaleString()}</p>
                {ref.status === 'completed' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <CheckCircle size={12} /> Earned
                  </span>
                ) : ref.status === 'invalid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    <AlertTriangle size={12} /> Invalid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    <Clock size={12} /> Pending Order
                  </span>
                )}
              </div>
            </div>
          ))}
          {referrals.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              You haven't invited anyone yet. Share your link to start earning!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
