import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Upload,
  ChevronRight,
  ShoppingCart,
  CheckCircle2,
  Truck,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { usePlaceOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { orderServices } from "@/services/OrderServices";
import { Card } from "@/components/ui/card";
import { UserInput } from "@/components/ui/input";
import { apiClient } from "@/services/api";

const STEPS = [
  { label: "Cart", icon: ShoppingCart },
  { label: "Checkout", icon: CreditCard },
  { label: "Confirmation", icon: CheckCircle2 },
  { label: "Tracking", icon: Truck },
];

export default function Checkout() {
  const navigate = useNavigate();

  const cart = useCartStore((state) => state.cart);
  const subtotal = useCartStore((state) => state.getCartSubtotal());
  const clearCart = useCartStore((state) => state.clearCart);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "pay_on_delivery" | "paystack" | "flutterwave">("paystack");
  const [transactionReference, setTransactionReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  
  const placeOrderMutation = usePlaceOrder();
  const { user } = useAuth();

  // Fetch vendor bank details
  const [vendorBank, setVendorBank] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (paymentMethod === "bank_transfer" && cart.length > 0) {
        try {
          setLoadingBank(true);
          const vendorId = cart[0].vendorId;
          const res = await orderServices.getVendorBankDetails(vendorId);
          if (res.success && res.bankDetails) {
            setVendorBank(res.bankDetails);
          }
        } catch (err) {
          console.error("Failed to fetch vendor bank details:", err);
        } finally {
          setLoadingBank(false);
        }
      }
    };
    fetchBankDetails();
  }, [paymentMethod, cart]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setName(user.fullName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const deliveryFee = 0; // Free delivery or flat rate since zones are removed
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500">Add products before checking out</p>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      return alert("Please fill in your name and phone number");
    }

    if (paymentMethod === "bank_transfer" && !transactionReference.trim()) {
      return alert("Please provide your transaction reference");
    }

    // Build items array matching backend expectations
    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.qty
    }));

    const formData = new FormData();
    formData.append("items", JSON.stringify(items));
    formData.append("customer_name", name);
    formData.append("phone", phone);
    formData.append("payment_method", paymentMethod);
    if (paymentMethod === "bank_transfer") {
      formData.append("transaction_reference", transactionReference);
    }
    if (proof) {
      formData.append("payment_proof", proof);
    }

    placeOrderMutation.mutate(formData, {
      onSuccess: (data) => {
        if (paymentMethod === 'paystack' || paymentMethod === 'flutterwave') {
           // Redirect to secure backend-generated payment URL
           if (data.paymentUrl) {
               window.location.href = data.paymentUrl;
           } else {
               alert("Payment URL not provided by server.");
           }
        } else {
           clearCart();
           navigate(`/order-confirmation/${data.order.id}`);
        }
      },
      onError: (err: any) => {
        console.error("Order error:", err);
        alert(err.response?.data?.message || "Unable to place order. Please check connection.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl py-4 px-4 sm:py-6 mt-8 lg:px-6 overflow-hidden">
      {/* Progress Steps */}
      <div className="mb-6 w-full max-w-full overflow-x-auto pb-2 scrollbar-none">
        <div className="flex min-w-max items-center sm:justify-center px-1">
          {STEPS.map((step, i) => {
            const isActive = i === 1;
            const isCompleted = i < 1;
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`mt-1 text-[10px] sm:text-[11px] font-semibold ${
                      isActive
                        ? "text-orange-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-1 sm:mx-2 mb-5 h-[2px] w-6 sm:w-12 md:w-20 bg-gray-200">
                    <div
                      className={`h-full transition-all ${
                        isCompleted ? "w-full bg-green-500" : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left Column — Forms */}
        <div className="space-y-4 lg:col-span-7 lg:space-y-6 min-w-0">
          <Card className="w-full overflow-hidden p-0">
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Delivery Details</h2>
              </div>

              <div className="space-y-4">
                <UserInput
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />

                <UserInput
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  type="tel"
                />
              </div>
            </div>
          </Card>

          <Card className="w-full overflow-hidden p-0">
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                    paymentMethod === "paystack"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "paystack"}
                    onChange={() => setPaymentMethod("paystack")}
                    className="accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      Paystack 
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Fast & Secure</span>
                    </p>
                    <p className="text-xs text-gray-500">Pay securely via card, transfer, or USSD</p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                    paymentMethod === "flutterwave"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "flutterwave"}
                    onChange={() => setPaymentMethod("flutterwave")}
                    className="accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Flutterwave</p>
                    <p className="text-xs text-gray-500">Multiple payment options across Africa</p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                    paymentMethod === "bank_transfer"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")}
                    className="accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Direct Bank Transfer</p>
                    <p className="text-xs text-gray-500">Transfer directly to vendor's account</p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                    paymentMethod === "pay_on_delivery"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "pay_on_delivery"}
                    onChange={() => setPaymentMethod("pay_on_delivery")}
                    className="accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Pay on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Details */}
              {paymentMethod === "bank_transfer" && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 min-h-[120px]">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                      Transfer to this account
                    </p>
                    {loadingBank ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 size={16} className="animate-spin" /> Fetching bank details...
                      </div>
                    ) : vendorBank ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Bank:</span>{" "}
                          <span className="font-bold">{vendorBank.bankName}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Account:</span>{" "}
                          <span className="font-bold tracking-wide">{vendorBank.accountNumber}</span>
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-500">Name:</span>{" "}
                          <span className="font-bold">{vendorBank.accountName}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        Unable to load vendor bank details. Please try another payment method.
                      </div>
                    )}
                  </div>

                  <UserInput
                    label="Transaction Reference"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g. TRF-123456789"
                  />

                  <div className="flex flex-col gap-[10px] w-full">
                    <label className="text-sm font-medium text-foreground">Payment Proof (optional)</label>
                    <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-4 transition hover:border-orange-400 hover:bg-orange-50">
                      <Upload size={20} className="flex-shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-500 truncate flex-1 min-w-0">
                        {proof ? proof.name : "Upload screenshot or receipt"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column — Order Summary */}
        <div className="lg:col-span-5 min-w-0">
          <Card className="w-full overflow-hidden p-0">
            <div className="sticky top-24 p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-gray-900">Order Summary</h2>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      ₦{(Number(item.price) * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">₦{subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-gray-900">Free</span>
                </div>

                <hr className="border-gray-100" />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-orange-600">₦{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                disabled={placeOrderMutation.isPending}
                onClick={handleSubmit}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {placeOrderMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              <Link
                to="/cart"
                className="mt-3 block text-center text-sm font-medium text-gray-500 hover:text-orange-500 transition"
              >
                ← Back to Cart
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}