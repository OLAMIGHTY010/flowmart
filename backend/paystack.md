# FlowMart Escrow Payment Integration Guide (Frontend)

This document outlines how the frontend application handles payments for FlowMart using the dedicated `/payment` and `/orders` endpoints.

**Important Note on Escrow Logic:** The frontend does **not** handle any split payments, sub-accounts, or vendor payouts. The frontend simply charges the customer for the full cart amount. The backend securely holds the funds in a virtual Escrow and pays the vendor only after delivery is confirmed.

---

## The Checkout Flow (4 Steps)

### Step 1: Fetch the Paystack Public Key
Instead of hardcoding the Paystack key in the frontend `.env`, fetch it dynamically from the backend configuration route. This ensures environments (Test vs Live) are always synced.

**Endpoint:** `GET /api/v1/payment/config`

**Response:**
```json
{
  "success": true,
  "key": "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}