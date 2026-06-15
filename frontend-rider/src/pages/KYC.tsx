import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CreditCard, Landmark, User, AlertTriangle, Upload, Camera, ShieldCheck } from "lucide-react";
import { VendorButton } from "@/components/ui/button";
import { VendorInput } from "@/components/ui/input";
import OnboardingStepIndicator from "@/components/OnboardingStepIndicator";

type GovernmentIDType = "NIN" | "Driver's License" | "Passport";
type Relationship = "" | "Parent" | "Sibling" | "Spouse" | "Friend" | "Colleague" | "Other";

const BANKS = [
  "Access Bank", "First Bank", "GTBank", "UBA", "Zenith Bank",
  "Polaris Bank", "Fidelity Bank", "Sterling Bank", "Union Bank", "Wema Bank",
];

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-xs p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-emerald-600">{icon}</span>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function UploadBox({ label, preview, inputRef, onChange }: {
  label: string;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border rounded-2xl py-5 cursor-pointer hover:border-emerald-400 transition bg-muted/20"
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      {preview ? (
        <img src={preview} alt={label} className="h-14 object-contain rounded" />
      ) : (
        <>
          <Upload size={18} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </>
      )}
    </div>
  );
}

export default function IdentityVerification() {
  const navigate = useNavigate();

  const [idType, setIdType] = useState<GovernmentIDType>("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName] = useState("");

  const [guarantorName, setGuarantorName] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");
  const [guarantorIdImage, setGuarantorIdImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const guarantorIdRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!idNumber || !bankName || !accountNumber || !guarantorName || !relationship || !guarantorPhone) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/verification-pending");
    }, 1500);
  };

  const idTypes: GovernmentIDType[] = ["NIN", "Driver's License", "Passport"];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/60 px-4 pt-4 pb-3 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-foreground font-headings flex-grow text-center pr-6">
            Identity Verification
          </h1>
        </div>
        <div className="mt-1">
          <OnboardingStepIndicator currentStep={2} />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 max-w-lg mx-auto w-full">
        {/* Security badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-medium text-emerald-700">Your information is encrypted and secure</p>
        </div>

        {/* Government ID */}
        <Section icon={<CreditCard size={15} />} title="Government ID">
          <div className="flex rounded-xl border border-border overflow-hidden w-full">
            {idTypes.map((type) => (
              <button
                key={type}
                onClick={() => setIdType(type)}
                className={`flex-1 text-xs font-semibold py-2.5 transition cursor-pointer ${
                  idType === type
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <VendorInput
            label="ID Number"
            name="idNumber"
            type="text"
            placeholder="Enter your ID number"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            isError={showErrors && !idNumber.trim()}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <UploadBox
              label="Front"
              preview={frontImage}
              inputRef={frontRef}
              onChange={(e) => handleImageUpload(e, setFrontImage)}
            />
            <UploadBox
              label="Back"
              preview={backImage}
              inputRef={backRef}
              onChange={(e) => handleImageUpload(e, setBackImage)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground">Selfie Verification</p>
            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, setSelfie)}
            />
            <div
              onClick={() => selfieRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-6 cursor-pointer hover:border-emerald-400 transition bg-white"
            >
              {selfie ? (
                <img src={selfie} alt="Selfie" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <>
                  <Camera size={22} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Upload a clear selfie</p>
                </>
              )}
            </div>
          </div>
        </Section>

        {/* Bank Account Details */}
        <Section icon={<Landmark size={15} />} title="Bank Account Details">
          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium text-foreground">Bank Name</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={`w-full border rounded-md px-3 py-[14px] bg-background text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                showErrors && !bankName ? "border-destructive" : "border-gray-300"
              } ${!bankName ? "text-muted-foreground" : "text-foreground"}`}
            >
              <option value="" disabled>Select your bank</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <VendorInput
            label="Account Number"
            name="accountNumber"
            type="text"
            placeholder="Enter 10-digit account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            isError={showErrors && accountNumber.length !== 10}
            required
          />

          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium text-foreground">Account Name</label>
            <input
              type="text"
              value={accountName}
              readOnly
              placeholder="Auto-filled after verification"
              className="w-full border border-gray-200 rounded-md px-3 py-[14px] bg-muted/40 text-sm text-muted-foreground placeholder:text-muted-foreground/60 cursor-not-allowed"
            />
          </div>
        </Section>

        {/* Guarantor Details */}
        <Section icon={<User size={15} />} title="Guarantor Details">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Your guarantor must be a working adult who can vouch for your identity and character.
            </p>
          </div>

          <VendorInput
            label="Guarantor Full Name"
            name="guarantorName"
            type="text"
            placeholder="Enter full name"
            value={guarantorName}
            onChange={(e) => setGuarantorName(e.target.value)}
            isError={showErrors && !guarantorName.trim()}
            required
          />

          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium text-foreground">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship)}
              className={`w-full border rounded-md px-3 py-[14px] bg-background text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                showErrors && !relationship ? "border-destructive" : "border-gray-300"
              } ${!relationship ? "text-muted-foreground" : "text-foreground"}`}
            >
              <option value="" disabled>Select relationship</option>
              {["Parent", "Sibling", "Spouse", "Friend", "Colleague", "Other"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <VendorInput
            label="Phone Number"
            name="guarantorPhone"
            type="tel"
            placeholder="+234 000 000 0000"
            value={guarantorPhone}
            onChange={(e) => setGuarantorPhone(e.target.value)}
            isError={showErrors && !guarantorPhone.trim()}
            required
          />

          <div className="flex flex-col gap-[10px]">
            <label className="text-sm font-medium text-foreground">Home Address</label>
            <textarea
              value={guarantorAddress}
              onChange={(e) => setGuarantorAddress(e.target.value)}
              placeholder="Enter guarantor's home address"
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-3 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-foreground">Upload Guarantor ID</p>
            <input
              ref={guarantorIdRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleImageUpload(e, setGuarantorIdImage)}
            />
            <div
              onClick={() => guarantorIdRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-2xl py-6 cursor-pointer hover:border-emerald-400 transition bg-white"
            >
              {guarantorIdImage ? (
                <img src={guarantorIdImage} alt="Guarantor ID" className="h-16 object-contain rounded" />
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Tap to upload ID document</p>
                </>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* Sticky Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/60 px-4 py-4 z-20">
        <div className="max-w-lg mx-auto">
          <VendorButton
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200"
          >
            {loading ? "Submitting..." : "✓ Submit Application"}
          </VendorButton>
        </div>
      </div>
    </div>
  );
}