import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Upload,
  ChevronRight,
  ShoppingCart,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/hooks/useAuth";
import {
  useOrderStore,
  generateOrderId,
  buildInitialTimeline,
} from "@/stores/orderStore";
import { Card } from "@/components/ui/card";
import { UserInput } from "@/components/ui/input";

const zones = [
  { name: "Camp Gate", fee: 500 },
  { name: "Youth Center Area", fee: 800 },
  { name: "Hostel Zone A", fee: 1000 },
  { name: "Hostel Zone B", fee: 1200 },
  { name: "Prayer Ground Area", fee: 700 },
];

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
  const addOrder = useOrderStore((state) => state.addOrder);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [paymentMethod, setPaymentMethod] = useState<
    "bank_transfer" | "pay_on_delivery"
  >("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const total = subtotal + selectedZone.fee;

  const vendorBank = {
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "Flowmart Vendor",
  };

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Add products before checking out
        </p>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const { submitOrder } = useCheckout();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      return alert("Please fill in your name and phone number");
    }

    if (
      paymentMethod === "bank_transfer" &&
      !transactionReference.trim()
    ) {
      return alert("Please provide your transaction reference");
    }

    setLoading(true);

    try {
      const orderId = generateOrderId();
      const timeline = buildInitialTimeline(paymentMethod);

      // Prepare payload for backend db.json
      const formData = new FormData();
      formData.append("id", orderId);
      formData.append("customer_name", name);
      formData.append("phone", phone);
      formData.append("zone", selectedZone.name);
      formData.append("payment_method", paymentMethod);
      formData.append("transaction_reference", transactionReference);
      if (proof) {
        formData.append("payment_proof", proof);
      }
      formData.append("delivery_fee", String(selectedZone.fee));
      formData.append("status", paymentMethod === "bank_transfer" ? "awaiting_payment" : "awaiting_confirmation");
      formData.append("createdAt", new Date().toISOString());
      cart.forEach((item) => {
        formData.append(
          "items[]",
          JSON.stringify({
            product_id: item.id,
            qty: item.qty,
          })
        );
      });

      await submitOrder(formData);

      const order = {
        id: orderId,
        items: [...cart],
        customerName: name,
        phone,
        zone: selectedZone.name,
        deliveryFee: selectedZone.fee,
        subtotal,
        total,
        paymentMethod,
        transactionReference:
          paymentMethod === "bank_transfer"
            ? transactionReference
            : undefined,
        status:
          paymentMethod === "bank_transfer"
            ? ("awaiting_payment" as const)
            : ("awaiting_confirmation" as const),
        timeline,
        createdAt: new Date().toISOString(),
      };

      addOrder(order);
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error(err);
      alert("Unable to place order. Please check connection.");
    } finally {
      setLoading(false);
    }
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

      {/* Two-column grid */}
      <div className="grid w-full gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left Column — Forms */}
        <div className="space-y-4 lg:col-span-7 lg:space-y-6 min-w-0">
          {/* Delivery Details Card */}
          <Card className="w-full overflow-hidden p-0">
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <MapPin size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  Delivery Details
                </h2>
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

                <div className="flex flex-col gap-[10px] w-full">
                  <label className="text-sm font-medium text-foreground">
                    Delivery Zone
                  </label>
                  <select
                    value={selectedZone.name}
                    onChange={(e) =>
                      setSelectedZone(
                        zones.find((z) => z.name === e.target.value)!
                      )
                    }
                    className="flex items-center w-full border border-gray-300 rounded-md px-3 py-[14px] bg-background text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {zones.map((zone) => (
                      <option key={zone.name} value={zone.name}>
                        {zone.name} — ₦{zone.fee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Method Card */}
          <Card className="w-full overflow-hidden p-0">
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <CreditCard size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
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
                    <p className="text-sm font-semibold text-gray-900">
                      Bank Transfer
                    </p>
                    <p className="text-xs text-gray-500">
                      Transfer to our bank account
                    </p>
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
                    <p className="text-sm font-semibold text-gray-900">
                      Pay on Delivery
                    </p>
                    <p className="text-xs text-gray-500">
                      Pay when your order arrives
                    </p>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Details */}
              {paymentMethod === "bank_transfer" && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                      Transfer to this account
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Bank:</span>{" "}
                        <span className="font-bold">{vendorBank.bankName}</span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Account:</span>{" "}
                        <span className="font-bold tracking-wide">
                          {vendorBank.accountNumber}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-500">Name:</span>{" "}
                        <span className="font-bold">{vendorBank.accountName}</span>
                      </p>
                    </div>
                  </div>

                  <UserInput
                    label="Transaction Reference"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="e.g. TRF-123456789"
                  />

                  <div className="flex flex-col gap-[10px] w-full">
                    <label className="text-sm font-medium text-foreground">
                      Payment Proof (optional)
                    </label>
                    <label className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-4 transition hover:border-orange-400 hover:bg-orange-50">
                      <Upload size={20} className="flex-shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-500 truncate flex-1 min-w-0">
                        {proof ? proof.name : "Upload screenshot or receipt"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          setProof(e.target.files?.[0] ?? null)
                        }
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
              <h2 className="mb-5 text-lg font-bold text-gray-900">
                Order Summary
              </h2>

              {/* Items */}
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      ₦{(Number(item.price) * item.qty).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₦{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-semibold text-gray-900">
                    ₦{selectedZone.fee.toLocaleString()}
                  </span>
                </div>

                <hr className="border-gray-100" />

                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-orange-600">
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
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