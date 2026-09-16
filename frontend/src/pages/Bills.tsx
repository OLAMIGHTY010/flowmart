import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import {
  Phone,
  Zap,
  Tv,
  Wifi,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Provider {
  id: string;
  name: string;
  billerCode: string;
  itemCode: string;
  amount?: number;
  shortName?: string;
}

interface ValidationResult {
  name: string;
  address?: string;
  status: string;
}

interface BillCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  inputLabel: string;
  inputPlaceholder: string;
  inputType: string;
  showAmountPicker: boolean;
}

interface Toast {
  id: number;
  type: "success" | "error";
  title: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BILL_CATEGORIES: BillCategory[] = [
  {
    key: "airtime",
    label: "Airtime",
    icon: <Phone className="h-5 w-5" />,
    type: "airtime",
    inputLabel: "Phone Number",
    inputPlaceholder: "08012345678",
    inputType: "tel",
    showAmountPicker: true,
  },
  {
    key: "data",
    label: "Data",
    icon: <Wifi className="h-5 w-5" />,
    type: "data",
    inputLabel: "Phone Number",
    inputPlaceholder: "08012345678",
    inputType: "tel",
    showAmountPicker: false,
  },
  {
    key: "electricity",
    label: "Electricity",
    icon: <Zap className="h-5 w-5" />,
    type: "power",
    inputLabel: "Meter Number",
    inputPlaceholder: "Enter meter number",
    inputType: "text",
    showAmountPicker: true,
  },
  {
    key: "cable",
    label: "Cable TV",
    icon: <Tv className="h-5 w-5" />,
    type: "cable",
    inputLabel: "Smartcard Number",
    inputPlaceholder: "Enter smartcard number",
    inputType: "text",
    showAmountPicker: false,
  },
];

const QUICK_AMOUNTS = [100, 200, 500, 1_000, 2_000, 5_000];

const NETWORK_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  MTN: { bg: "bg-yellow-400", text: "text-yellow-900", ring: "ring-yellow-300" },
  GLO: { bg: "bg-green-500", text: "text-white", ring: "ring-green-300" },
  AIRTEL: { bg: "bg-red-500", text: "text-white", ring: "ring-red-300" },
  "9MOBILE": { bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-300" },
  ETISALAT: { bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-300" },
  // Electricity discos
  IKEJA: { bg: "bg-blue-500", text: "text-white", ring: "ring-blue-300" },
  EKO: { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-300" },
  ABUJA: { bg: "bg-purple-500", text: "text-white", ring: "ring-purple-300" },
  PORTHARCOURT: { bg: "bg-teal-500", text: "text-white", ring: "ring-teal-300" },
  PH: { bg: "bg-teal-500", text: "text-white", ring: "ring-teal-300" },
  // Cable
  DSTV: { bg: "bg-blue-600", text: "text-white", ring: "ring-blue-300" },
  GOTV: { bg: "bg-yellow-500", text: "text-yellow-900", ring: "ring-yellow-300" },
  STARTIMES: { bg: "bg-orange-600", text: "text-white", ring: "ring-orange-300" },
};

function getNetworkStyle(name: string) {
  const upper = name.toUpperCase();
  for (const [key, style] of Object.entries(NETWORK_STYLES)) {
    if (upper.includes(key)) return style;
  }
  return { bg: "bg-gray-500", text: "text-white", ring: "ring-gray-300" };
}

function getInitials(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("MTN")) return "MTN";
  if (upper.includes("GLO")) return "GLO";
  if (upper.includes("AIRTEL")) return "AIR";
  if (upper.includes("9MOBILE") || upper.includes("ETISALAT")) return "9M";
  if (upper.includes("DSTV")) return "DS";
  if (upper.includes("GOTV")) return "GO";
  if (upper.includes("STARTIMES")) return "ST";
  if (upper.includes("IKEJA")) return "IE";
  if (upper.includes("EKO")) return "EK";
  if (upper.includes("ABUJA")) return "AB";
  if (upper.includes("PORT") || upper.includes("PH")) return "PH";
  return name.slice(0, 2).toUpperCase();
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

let toastCounter = 0;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Bills() {
  /* ---- state ---- */
  const [activeTab, setActiveTab] = useState(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [paying, setPaying] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const category = BILL_CATEGORIES[activeTab];

  /* ---- helpers ---- */
  const pushToast = useCallback((type: "success" | "error", title: string, message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---- fetch providers when tab changes ---- */
  useEffect(() => {
    let cancelled = false;
    const fetchProviders = async () => {
      setLoadingProviders(true);
      setProviders([]);
      setSelectedProvider(null);
      setValidation(null);
      setCustomer("");
      setAmount("");
      setSelectedQuickAmount(null);
      try {
        const res = await apiClient.get<{ success: boolean; data: Provider[] }>(
          `/bills/categories?type=${category.type}`
        );
        if (!cancelled && res.data) setProviders(res.data);
      } catch {
        if (!cancelled) pushToast("error", "Connection Error", "Could not load providers. Please try again.");
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    };
    fetchProviders();
    return () => {
      cancelled = true;
    };
  }, [activeTab, category.type, pushToast]);

  /* ---- validate customer ---- */
  const handleValidate = async () => {
    if (!selectedProvider || !customer.trim()) return;
    setValidating(true);
    setValidation(null);
    try {
      const res = await apiClient.get<{ success: boolean; data: ValidationResult }>(
        `/bills/validate?itemCode=${selectedProvider.itemCode}&customer=${customer}&billerCode=${selectedProvider.billerCode}`
      );
      if (res.data) {
        setValidation(res.data);
      }
    } catch {
      pushToast("error", "Validation Failed", "Could not validate this account. Please check the details.");
    } finally {
      setValidating(false);
    }
  };

  /* ---- pay ---- */
  const handlePay = async () => {
    if (!selectedProvider || !customer.trim()) return;
    const payAmount = selectedProvider.amount || Number(amount);
    if (!payAmount || payAmount <= 0) {
      pushToast("error", "Invalid Amount", "Please enter a valid amount.");
      return;
    }
    setPaying(true);
    try {
      await apiClient.post<{ success: boolean; data: unknown }>("/bills/pay", {
        category: category.type,
        customer,
        amount: payAmount,
        billerCode: selectedProvider.billerCode,
        itemCode: selectedProvider.itemCode,
      });
      pushToast("success", "Payment Successful! 🎉", `${formatNaira(payAmount)} ${category.label} payment completed.`);
      setCustomer("");
      setAmount("");
      setSelectedQuickAmount(null);
      setSelectedProvider(null);
      setValidation(null);
    } catch {
      pushToast("error", "Payment Failed", "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const effectiveAmount = selectedProvider?.amount || Number(amount) || 0;
  const needsValidation = category.key === "electricity" || category.key === "cable";
  const canPay =
    selectedProvider &&
    customer.trim().length >= 5 &&
    effectiveAmount > 0 &&
    (!needsValidation || validation);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 pb-12">
      {/* ---- Header ---- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-500 px-4 pb-10 pt-8 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pay Bills</h1>
              <p className="mt-0.5 text-sm text-emerald-100">Fast & secure bill payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tab bar ---- */}
      <div className="relative mx-auto -mt-6 max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-lg shadow-emerald-100/60 ring-1 ring-black/5">
          {BILL_CATEGORIES.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(i)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all duration-200 sm:flex-row sm:gap-2 sm:text-sm cursor-pointer ${
                activeTab === i
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {cat.icon}
              <span className="hidden xs:inline sm:inline">{cat.label}</span>
              <span className="xs:hidden sm:hidden text-[10px] leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Main content ---- */}
      <div className="mx-auto mt-6 max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-black/5">
          {/* Provider picker */}
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Select Provider
            </label>

            {loadingProviders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
              </div>
            ) : providers.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p className="text-sm">No providers available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {providers.map((p) => {
                  const style = getNetworkStyle(p.name);
                  const selected = selectedProvider?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProvider(p);
                        setValidation(null);
                        if (p.amount) {
                          setAmount(String(p.amount));
                          setSelectedQuickAmount(null);
                        }
                      }}
                      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                        selected
                          ? `border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100`
                          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      {selected && (
                        <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${style.bg} ${style.text} ring-2 ${style.ring} text-xs font-bold shadow-sm transition-transform duration-200 group-hover:scale-105`}
                      >
                        {getInitials(p.name)}
                      </div>
                      <span className="text-center text-xs font-medium text-gray-700 leading-tight">
                        {p.shortName || p.name}
                      </span>
                      {p.amount != null && p.amount > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600">
                          {formatNaira(p.amount)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer input + validation */}
          {selectedProvider && (
            <div className="border-b border-gray-100 p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {category.inputLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type={category.inputType}
                  value={customer}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setValidation(null);
                  }}
                  placeholder={category.inputPlaceholder}
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
                {needsValidation && (
                  <button
                    onClick={handleValidate}
                    disabled={validating || customer.trim().length < 5}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Validate</span>
                  </button>
                )}
              </div>

              {/* Validation result badge */}
              {validation && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm animate-in fade-in duration-200">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <span className="font-semibold text-emerald-800">{validation.name}</span>
                    {validation.address && (
                      <span className="ml-1 text-emerald-600">— {validation.address}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount section */}
          {selectedProvider && (
            <div className="p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {category.showAmountPicker && (
                <>
                  <label className="mb-3 block text-sm font-semibold text-gray-700">
                    Select Amount
                  </label>
                  <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {QUICK_AMOUNTS.map((qa) => (
                      <button
                        key={qa}
                        onClick={() => {
                          setSelectedQuickAmount(qa);
                          setAmount(String(qa));
                        }}
                        className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                          selectedQuickAmount === qa
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                            : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        {formatNaira(qa)}
                      </button>
                    ))}
                  </div>

                  <div className="relative mb-5">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="50"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setSelectedQuickAmount(null);
                      }}
                      placeholder="Custom amount"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </>
              )}

              {/* Fixed-amount display for data / cable */}
              {!category.showAmountPicker && selectedProvider.amount != null && selectedProvider.amount > 0 && (
                <div className="mb-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatNaira(selectedProvider.amount)}
                  </span>
                </div>
              )}

              {/* Summary */}
              {canPay && (
                <div className="mb-5 space-y-2 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 p-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Provider</span>
                    <span className="font-semibold text-gray-900">
                      {selectedProvider?.shortName || selectedProvider?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{category.inputLabel}</span>
                    <span className="font-semibold text-gray-900">{customer}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2 text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatNaira(effectiveAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={!canPay || paying}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {paying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Pay {effectiveAmount > 0 ? formatNaira(effectiveAmount) : ""}
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>
            </div>
          )}

          {/* Empty state when no provider selected */}
          {!selectedProvider && !loadingProviders && providers.length > 0 && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                {category.icon}
              </div>
              <p className="text-sm font-medium">Select a provider to continue</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Toast notifications ---- */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-xl ring-1 backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              t.type === "success"
                ? "bg-emerald-600 text-white ring-emerald-700/30"
                : "bg-red-600 text-white ring-red-700/30"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              <p className="text-xs text-white/80">{t.message}</p>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded-lg p-1 transition hover:bg-white/20 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
