import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useKYCStatus } from '@/hooks/vendor/useVendorQueries';
import { 
  User, Mail, Phone, ShoppingBag, Landmark, Clock, Key, MapPin, 
  Map, DollarSign, Lock, ShieldCheck, Bell, LogOut, ChevronRight, ArrowLeft, Check, 
} from 'lucide-react';
import { VendorInput } from '@/components/ui/input';
import { VendorButton } from '@/components/ui/button';

export default function StoreTab() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const { data: kycStatus } = useKYCStatus();
  
  // Navigation stack state
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Local settings state
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");

  // Payment State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [payoutSchedule, setPayoutSchedule] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [newPin, setNewPin] = useState("");

  // Delivery State
  const [deliveryZones, setDeliveryZones] = useState<string[]>([""]);
  const [pickupPoints, setPickupPoints] = useState<string[]>([""]);
  const [newPickupPoint, setNewPickupPoint] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  // Security / Account State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifDelivery, setNotifDelivery] = useState(true);
  const [notifPayouts, setNotifPayouts] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const profile = localStorage.getItem("vendor_profile");
      if (profile) {
        const parsed = JSON.parse(profile);
        if (parsed.displayName) setStoreName(parsed.displayName);
        if (parsed.businessPhone) setPhone(parsed.businessPhone);
      }

      const kyc = localStorage.getItem("vendor_kyc_info");
      if (kyc) {
        const parsed = JSON.parse(kyc);
        if (parsed.businessName) setStoreName(parsed.businessName);
        if (parsed.bankName) setBankName(parsed.bankName);
        if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
        if (parsed.accountName) setAccountName(parsed.accountName);
      }

      const userStr = localStorage.getItem("auth_user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed.email) setEmail(parsed.email);
      }

      const localSettings = localStorage.getItem("vendor_store_settings");
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.payoutSchedule) setPayoutSchedule(parsed.payoutSchedule);
        if (parsed.deliveryZones) setDeliveryZones(parsed.deliveryZones);
        if (parsed.pickupPoints) setPickupPoints(parsed.pickupPoints);
        if (parsed.deliveryFee) setDeliveryFee(parsed.deliveryFee);
        if (parsed.notifNewOrder !== undefined) setNotifNewOrder(parsed.notifNewOrder);
        if (parsed.notifDelivery !== undefined) setNotifDelivery(parsed.notifDelivery);
        if (parsed.notifPayouts !== undefined) setNotifPayouts(parsed.notifPayouts);
      }
    } catch (err) {
      console.error("Failed loading settings from localstorage", err);
    }
  }, []);

  // Save Settings Helper
  const saveSettings = (updatedFields: any, successMsg = "Settings Saved!") => {
    try {
      const localSettings = localStorage.getItem("vendor_store_settings") || "{}";
      const current = JSON.parse(localSettings);
      const merged = { ...current, ...updatedFields };
      localStorage.setItem("vendor_store_settings", JSON.stringify(merged));
      
      setToastMessage(successMsg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleSignOut = () => {
    if (window.confirm("Do you want to log out?")) {
      logout().then(() => navigate("/"));
    }
  };

  // Render Sub-page
  if (activeSubPage) {
    let subPageTitle = "";
    let content = null;

    if (activeSubPage === 'business_name') {
      subPageTitle = "Business Name";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          const profile = localStorage.getItem("vendor_profile") || "{}";
          const parsed = JSON.parse(profile);
          parsed.displayName = storeName;
          localStorage.setItem("vendor_profile", JSON.stringify(parsed));
          saveSettings({ storeName });
          setActiveSubPage(null);
        }} className="flex flex-col gap-5">
          <VendorInput 
            label="Business/Store Name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
          <VendorButton type="submit">Save Changes</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'contact_email') {
      subPageTitle = "Contact Email";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          saveSettings({ email });
          setActiveSubPage(null);
        }} className="flex flex-col gap-5">
          <VendorInput 
            label="Contact Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <VendorButton type="submit">Save Changes</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'phone_number') {
      subPageTitle = "Phone Number";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          const profile = localStorage.getItem("vendor_profile") || "{}";
          const parsed = JSON.parse(profile);
          parsed.businessPhone = phone;
          localStorage.setItem("vendor_profile", JSON.stringify(parsed));
          saveSettings({ phone });
          setActiveSubPage(null);
        }} className="flex flex-col gap-5">
          <VendorInput 
            label="Business Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <VendorButton type="submit">Save Changes</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'store_category') {
      subPageTitle = "Store Category";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          saveSettings({ category });
          setActiveSubPage(null);
        }} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground">Select Category</label>
            {["Food & Catering", "Beverages", "Merchandise", "Snacks", "Groceries", "Electronics"].map((cat) => (
              <label 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  category === cat 
                    ? 'border-primary bg-primary/5 font-bold text-primary' 
                    : 'border-border bg-input'
                }`}
              >
                <span className="text-sm">{cat}</span>
                {category === cat && <Check size={16} className="text-primary" />}
              </label>
            ))}
          </div>
          <VendorButton type="submit" className="mt-2">Save Changes</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'bank_account') {
      subPageTitle = "Bank Account Details";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          const kyc = localStorage.getItem("vendor_kyc_info") || "{}";
          const parsed = JSON.parse(kyc);
          parsed.bankName = bankName;
          parsed.accountNumber = accountNumber;
          parsed.accountName = accountName;
          localStorage.setItem("vendor_kyc_info", JSON.stringify(parsed));
          saveSettings({ bankName, accountNumber, accountName }, "Bank account details saved!");
          setActiveSubPage(null);
        }} className="flex flex-col gap-4">
          <VendorInput 
            label="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <VendorInput 
            label="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <VendorInput 
            label="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
          <VendorButton type="submit" className="mt-2">Save Details</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'payout_schedule') {
      subPageTitle = "Payout Schedule";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          saveSettings({ payoutSchedule });
          setActiveSubPage(null);
        }} className="flex flex-col gap-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Select how frequently you want FlowMart to disburse your accumulated sales revenue to your bank account.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { id: 'daily', label: 'Daily Payouts', desc: 'Settled every day at 11:59 PM' },
              { id: 'weekly', label: 'Weekly Payouts', desc: 'Settled every Friday morning' },
              { id: 'monthly', label: 'Monthly Payouts', desc: 'Settled on the last calendar day' }
            ].map((sched) => (
              <label 
                key={sched.id}
                onClick={() => setPayoutSchedule(sched.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  payoutSchedule === sched.id 
                    ? 'border-primary bg-primary/5 font-bold text-primary' 
                    : 'border-border bg-input'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{sched.label}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">{sched.desc}</span>
                </div>
                {payoutSchedule === sched.id && <Check size={16} className="text-primary" />}
              </label>
            ))}
          </div>
          <VendorButton type="submit" className="mt-2">Apply Schedule</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'transaction_pin') {
      subPageTitle = "Transaction PIN";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newPin.length !== 4 || isNaN(parseInt(newPin))) {
            alert("PIN must be exactly 4 digits");
            return;
          }
          setTransactionPin("****");
          saveSettings({ transactionPin: "****" }, "Transaction PIN updated!");
          setActiveSubPage(null);
        }} className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground mb-1 leading-relaxed">
            Enter a secure 4-digit PIN. This is required to verify your identity when withdrawing funds.
          </p>
          <VendorInput 
            label="New 4-digit PIN"
            type="password"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            required
          />
          <VendorButton type="submit" className="mt-2">Update PIN</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'delivery_zones') {
      subPageTitle = "Delivery Zones";
      const zonesList = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"];
      
      const toggleZone = (z: string) => {
        if (deliveryZones.includes(z)) {
          setDeliveryZones(deliveryZones.filter(dz => dz !== z));
        } else {
          setDeliveryZones([...deliveryZones, z]);
        }
      };

      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          saveSettings({ deliveryZones });
          setActiveSubPage(null);
        }} className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground mb-1 leading-relaxed">
            Select the fulfillment zones you are willing to deliver to. Attendees in these zones will see your store.
          </p>
          <div className="flex flex-col gap-2">
            {zonesList.map((z) => {
              const isChecked = deliveryZones.includes(z);
              return (
                <label 
                  key={z}
                  onClick={() => toggleZone(z)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked 
                      ? 'border-primary bg-primary/5 font-bold text-primary' 
                      : 'border-border bg-input'
                  }`}
                >
                  <span className="text-sm">{z}</span>
                  {isChecked && <Check size={16} className="text-primary" />}
                </label>
              );
            })}
          </div>
          <VendorButton type="submit" className="mt-2">Save Zones</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'pickup_points') {
      subPageTitle = "Pickup Points";
      
      const removePoint = (idx: number) => {
        const updated = [...pickupPoints];
        updated.splice(idx, 1);
        setPickupPoints(updated);
      };

      const addPoint = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPickupPoint.trim()) {
          setPickupPoints([...pickupPoints, newPickupPoint.trim()]);
          setNewPickupPoint("");
        }
      };

      return (
        <div className="flex-grow flex flex-col p-5 bg-background min-h-screen">
          <div className="flex items-center gap-3 mb-6 border-b border-border/80 pb-4">
            <button onClick={() => setActiveSubPage(null)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-base font-bold text-foreground font-headings">{subPageTitle}</h2>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <form onSubmit={addPoint} className="flex gap-2">
              <input 
                type="text"
                placeholder="Add new pickup booth address..."
                value={newPickupPoint}
                onChange={(e) => setNewPickupPoint(e.target.value)}
                className="flex-1 bg-[#f3f4f6] rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button 
                type="submit"
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="flex flex-col gap-2">
              {pickupPoints.map((pt, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-surface border border-border/80 rounded-xl">
                  <span className="text-xs font-semibold text-foreground">{pt}</span>
                  <button 
                    onClick={() => removePoint(i)}
                    className="text-red-500 text-xs font-bold hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <VendorButton 
              onClick={() => {
                saveSettings({ pickupPoints });
                setActiveSubPage(null);
              }}
              className="mt-auto"
            >
              Save Changes
            </VendorButton>
          </div>
        </div>
      );
    }

    if (activeSubPage === 'delivery_fee') {
      subPageTitle = "Delivery Fee Structure";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          saveSettings({ deliveryFee });
          setActiveSubPage(null);
        }} className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Define the flat delivery fee charged to customer orders. This amount goes directly to cover camp dispatch riders.
          </p>
          <VendorInput 
            label="Flat Delivery Fee (₦)"
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            required
          />
          <VendorButton type="submit" className="mt-2">Update Delivery Fee</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'change_password') {
      subPageTitle = "Change Password";
      content = (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
          }
          setOldPassword("");
          setNewPassword("");
          setConfirmPassword("");
          triggerToast("Password changed successfully!");
          setActiveSubPage(null);
        }} className="flex flex-col gap-4">
          <VendorInput 
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <VendorInput 
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <VendorInput 
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <VendorButton type="submit" className="mt-2">Update Password</VendorButton>
        </form>
      );
    }

    if (activeSubPage === 'kyc_verification') {
      subPageTitle = "KYC Verification Timeline";
      const isVerified = kycStatus?.status === 'approved';
      
      content = (
        <div className="flex flex-col gap-6">
          <div className={`border p-4 rounded-2xl flex items-center gap-3 ${isVerified ? 'bg-[#dcfce7] border-[#bbf7d0]' : 'bg-[#fef9c3] border-[#fde047]'}`}>
            <ShieldCheck size={36} className={isVerified ? "text-[#15803d]" : "text-[#a16207]"} />
            <div>
              <h4 className={`text-sm font-bold ${isVerified ? 'text-[#166534]' : 'text-[#854d0e]'}`}>
                {isVerified ? 'RCCG KYC Verified' : 'KYC Under Review'}
              </h4>
              <p className={`text-[11px] mt-0.5 ${isVerified ? 'text-[#15803d]' : 'text-[#a16207]'}`}>
                {isVerified ? 'Your identity documents are fully checked and approved by RCCG.' : 'Your documents are currently being reviewed by admins.'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Verification Logs</h4>
            <div className="flex flex-col gap-4 pl-4 border-l-2 border-primary/20">
              {kycStatus?.steps?.map((step: any, idx: number) => (
                <div key={idx} className="relative flex flex-col gap-0.5">
                  <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ${step.status === 'done' ? 'bg-[#16a34a]' : 'bg-primary'}`} />
                  <span className="text-xs font-bold text-foreground">{step.label}</span>
                  <span className={`text-[9px] font-semibold mt-0.5 ${step.status === 'done' ? 'text-[#16a34a]' : 'text-primary'}`}>{step.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeSubPage === 'notifications') {
      subPageTitle = "Notification Preferences";
      
      const toggle = (pref: string) => {
        let update = {};
        if (pref === 'order') {
          update = { notifNewOrder: !notifNewOrder };
          setNotifNewOrder(!notifNewOrder);
        } else if (pref === 'delivery') {
          update = { notifDelivery: !notifDelivery };
          setNotifDelivery(!notifDelivery);
        } else {
          update = { notifPayouts: !notifPayouts };
          setNotifPayouts(!notifPayouts);
        }
        
        // save directly
        const localSettings = localStorage.getItem("vendor_store_settings") || "{}";
        const current = JSON.parse(localSettings);
        localStorage.setItem("vendor_store_settings", JSON.stringify({ ...current, ...update }));
      };

      content = (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            Configure how you wish to receive alerts. We recommend leaving order notifications active.
          </p>

          {[
            { id: 'order', label: 'New Order Alerts', desc: 'Get notified immediately when a customer orders an item.', active: notifNewOrder },
            { id: 'delivery', label: 'Delivery Updates', desc: 'Notify when dispatch rider picks up or completes a delivery.', active: notifDelivery },
            { id: 'payouts', label: 'Payout Alerts', desc: 'Get SMS or Email notifications on successful financial payouts.', active: notifPayouts }
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center justify-between p-3.5 bg-surface border border-border/80 rounded-xl cursor-pointer"
            >
              <div className="flex flex-col gap-0.5 pr-4">
                <span className="text-xs font-bold text-foreground">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">{item.desc}</span>
              </div>
              <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${item.active ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex-grow flex flex-col p-5 bg-background min-h-screen">
        {/* Subpage Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-border/80 pb-4">
          <button onClick={() => setActiveSubPage(null)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-bold text-foreground font-headings">{subPageTitle}</h2>
        </div>

        {/* Subpage Form Content */}
        <div className="flex-1">
          {content}
        </div>
      </div>
    );
  }

  // Generate Store initials (e.g. Adebayo's Kitchen -> AK)
  const getInitials = (name: string) => {
    if (!name) return 'V';
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex-grow flex flex-col bg-background font-body pb-24 relative">
      {/* Toast popup */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={16} className="text-primary" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-xl font-headings font-extrabold text-foreground" style={{ fontWeight: 800 }}>Store Settings</h1>
      </div>

      {/* Avatar Block */}
      <div className="flex flex-col items-center gap-2.5 my-4 px-5">
        <div className="w-20 h-20 rounded-full bg-[#064e3b] text-white font-headings font-extrabold flex items-center justify-center text-2xl border-4 border-surface shadow-md">
          {getInitials(storeName)}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-headings font-extrabold text-foreground leading-tight">{storeName}</h2>
          <div className={`flex items-center justify-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full inline-flex ${kycStatus?.status === 'approved' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef9c3] text-[#a16207]'}`}>
            <ShieldCheck size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wide">
              {kycStatus?.status === 'approved' ? 'RCCG Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Options Panel */}
      <div className="px-5 flex flex-col gap-6 overflow-y-auto flex-1">
        {/* Business Information Section */}
        <div>
          <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">Business Information</h3>
          <div className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            {[
              { id: 'business_name', label: 'Business Name', icon: User, val: storeName },
              { id: 'contact_email', label: 'Contact Email', icon: Mail, val: email },
              { id: 'phone_number', label: 'Phone Number', icon: Phone, val: phone },
              { id: 'store_category', label: 'Store Category', icon: ShoppingBag, val: category }
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => setActiveSubPage(opt.id)}
                className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 last:border-b-0 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
              >
                <div className="flex items-center gap-3 text-foreground font-semibold">
                  <opt.icon size={16} className="text-primary" />
                  <span className="text-xs">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{opt.val}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Setup Section */}
        <div>
          <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">Payment Setup</h3>
          <div className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            {[
              { id: 'bank_account', label: 'Bank Account', icon: Landmark, val: bankName },
              { id: 'payout_schedule', label: 'Payout Schedule', icon: Clock, val: payoutSchedule },
              { id: 'transaction_pin', label: 'Transaction PIN', icon: Key, val: transactionPin }
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => setActiveSubPage(opt.id)}
                className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 last:border-b-0 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
              >
                <div className="flex items-center gap-3 text-foreground font-semibold">
                  <opt.icon size={16} className="text-primary" />
                  <span className="text-xs">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground capitalize">{opt.val}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Preferences Section */}
        <div>
          <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">Delivery Preferences</h3>
          <div className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            {[
              { id: 'delivery_zones', label: 'Delivery Zones', icon: Map, val: `${deliveryZones.length} zones` },
              { id: 'pickup_points', label: 'Pickup Points', icon: MapPin, val: `${pickupPoints.length} booths` },
              { id: 'delivery_fee', label: 'Delivery Fee Structure', icon: DollarSign, val: `₦${deliveryFee}` }
            ].map((opt) => (
              <button 
                key={opt.id}
                onClick={() => setActiveSubPage(opt.id)}
                className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 last:border-b-0 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
              >
                <div className="flex items-center gap-3 text-foreground font-semibold">
                  <opt.icon size={16} className="text-primary" />
                  <span className="text-xs">{opt.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{opt.val}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2.5">Account</h3>
          <div className="bg-surface border border-border/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <button 
              onClick={() => setActiveSubPage('change_password')}
              className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3 text-foreground font-semibold">
                <Lock size={16} className="text-primary" />
                <span className="text-xs">Change Password</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
            <button 
              onClick={() => setActiveSubPage('kyc_verification')}
              className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3 text-foreground font-semibold">
                <ShieldCheck size={16} className="text-primary" />
                <span className="text-xs">KYC Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${kycStatus?.status === 'approved' ? 'text-[#15803d] bg-[#dcfce7]' : 'text-[#a16207] bg-[#fef9c3]'}`}>
                  {kycStatus?.status === 'approved' ? 'Verified' : 'Pending'}
                </span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>
            <button 
              onClick={() => setActiveSubPage('notifications')}
              className="w-full flex items-center justify-between p-3.5 text-left border-b border-border/60 hover:bg-[#f9fafb] active:bg-[#f3f4f6] transition-all bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3 text-foreground font-semibold">
                <Bell size={16} className="text-primary" />
                <span className="text-xs">Notifications</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-red-50 transition-all bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3 text-red-600 font-semibold">
                <LogOut size={16} className="text-red-500" />
                <span className="text-xs">Sign Out</span>
              </div>
              <ChevronRight size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
