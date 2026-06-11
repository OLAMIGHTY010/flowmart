import React, { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useCheckout } from "@/hooks/useCheckout";

const zones = [
  { name: "Camp Gate", fee: 500 },
  { name: "Youth Center Area", fee: 800 },
  { name: "Hostel Zone A", fee: 1000 },
  { name: "Hostel Zone B", fee: 1200 },
  { name: "Prayer Ground Area", fee: 700 },
];

export default function Checkout() {
  const cart = useCartStore(
    (state) => state.cart
  );

  const subtotal = useCartStore(
    (state) => state.getCartSubtotal()
  );

  const { submitOrder, loading } =
    useCheckout();

  const [name, setName] = useState("");
  const [phone, setPhone] =
    useState("");

  const [selectedZone, setSelectedZone] =
    useState(zones[0]);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<
    "bank_transfer" | "pay_on_delivery"
  >("bank_transfer");

  const [
    transactionReference,
    setTransactionReference,
  ] = useState("");

  const [proof, setProof] =
    useState<File | null>(null);

  const total =
    subtotal + selectedZone.fee;

  const vendorBank = {
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "Flowmart Vendor",
  };

  const handleSubmit = async () => {
    if (!name || !phone) {
      return alert(
        "Please fill all required fields"
      );
    }

    if (
      paymentMethod ===
        "bank_transfer" &&
      (!proof || !transactionReference)
    ) {
      return alert(
        "Provide transfer proof and reference"
      );
    }

    const formData = new FormData();

    formData.append(
      "customer_name",
      name
    );

    formData.append("phone", phone);

    formData.append(
      "zone",
      selectedZone.name
    );

    formData.append(
      "payment_method",
      paymentMethod
    );

    formData.append(
      "transaction_reference",
      transactionReference
    );

    if (proof) {
      formData.append(
        "payment_proof",
        proof
      );
    }

    formData.append(
      "delivery_fee",
      String(selectedZone.fee)
    );

    cart.forEach((item) => {
      formData.append(
        "items[]",
        JSON.stringify({
          product_id: item.id,
          qty: item.qty,
        })
      );
    });

    try {
      await submitOrder(formData);

      alert(
        "Order submitted successfully"
      );
    } catch {
      alert(
        "Unable to submit order"
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 grid md:grid-cols-2 gap-6">
      <div className="space-y-4">

        <h2 className="text-xl font-bold">
          Delivery Details
        </h2>

        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Full Name"
          className="w-full rounded-lg border p-3"
        />

        <input
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          placeholder="Phone Number"
          className="w-full rounded-lg border p-3"
        />

        <select
          value={selectedZone.name}
          onChange={(e) =>
            setSelectedZone(
              zones.find(
                (z) =>
                  z.name ===
                  e.target.value
              )!
            )
          }
          className="w-full rounded-lg border p-3"
        >
          {zones.map((zone) => (
            <option
              key={zone.name}
              value={zone.name}
            >
              {zone.name} (₦{zone.fee})
            </option>
          ))}
        </select>

        <div className="rounded-xl border p-4">
          <h3 className="font-semibold">
            Payment Method
          </h3>

          <div className="mt-3 space-y-3">
            <label className="flex gap-2">
              <input
                type="radio"
                checked={
                  paymentMethod ===
                  "bank_transfer"
                }
                onChange={() =>
                  setPaymentMethod(
                    "bank_transfer"
                  )
                }
              />
              Bank Transfer
            </label>

            <label className="flex gap-2">
              <input
                type="radio"
                checked={
                  paymentMethod ===
                  "pay_on_delivery"
                }
                onChange={() =>
                  setPaymentMethod(
                    "pay_on_delivery"
                  )
                }
              />
              Pay On Delivery
            </label>
          </div>
        </div>

        {paymentMethod ===
          "bank_transfer" && (
          <div className="rounded-xl border bg-gray-50 p-4">
            <h4 className="font-semibold">
              Vendor Bank Details
            </h4>

            <p>
              {vendorBank.bankName}
            </p>

            <p>
              {vendorBank.accountNumber}
            </p>

            <p>
              {vendorBank.accountName}
            </p>

            <input
              value={
                transactionReference
              }
              onChange={(e) =>
                setTransactionReference(
                  e.target.value
                )
              }
              placeholder="Transaction Reference"
              className="mt-3 w-full rounded border p-3"
            />

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) =>
                setProof(
                  e.target.files?.[0] ??
                    null
                )
              }
              className="mt-3"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border p-5">
        <h2 className="text-lg font-bold">
          Order Summary
        </h2>

        {cart.map((item) => (
          <div
            key={item.id}
            className="mt-3 flex justify-between"
          >
            <span>
              {item.name} x {item.qty}
            </span>

            <span>
              ₦
              {(
                Number(item.price) *
                item.qty
              ).toLocaleString()}
            </span>
          </div>
        ))}

        <hr className="my-4" />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            ₦
            {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Delivery</span>
          <span>
            ₦
            {selectedZone.fee.toLocaleString()}
          </span>
        </div>

        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>Total</span>

          <span className="text-primary">
            ₦{total.toLocaleString()}
          </span>
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-white"
        >
          {loading
            ? "Submitting..."
            : "Place Order"}
        </button>
      </div>
    </div>
  );
}