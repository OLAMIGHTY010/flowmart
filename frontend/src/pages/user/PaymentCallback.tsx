import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/services/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      // Paystack usually sends `reference`
      // Flutterwave usually sends `transaction_id` and `tx_ref`
      const reference = searchParams.get("reference") || searchParams.get("tx_ref");
      const transactionId = searchParams.get("transaction_id");

      if (!reference && !transactionId) {
        setStatus("error");
        setErrorMessage("No payment reference found in the URL.");
        return;
      }

      const provider = searchParams.has("transaction_id") ? "flutterwave" : "paystack";

      try {
        const response = await apiClient.post("/payment/verify", {
          reference,
          transactionId,
          provider
        });

        const data = response as any;

        if (data.success) {
          setStatus("success");
          clearCart();
          setTimeout(() => {
            navigate(`/orders/${data.order?.id || reference}/track`);
          }, 2000);
        } else {
          setStatus("error");
          setErrorMessage(data.message || "Payment verification failed.");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Failed to contact the server for verification.");
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {status === "verifying" && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-orange-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Verifying Payment...</h1>
          <p className="mt-2 text-gray-500">Please do not refresh or close this page.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="mt-2 text-gray-500">Redirecting you to your order receipt...</p>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
          <p className="mt-2 text-gray-500">{errorMessage}</p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-6 rounded-lg bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Go to My Orders
          </button>
        </>
      )}
    </div>
  );
}
