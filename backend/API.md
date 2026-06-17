# FlowMart API Documentation

**Base URL (Local Development):** `http://localhost:5000/api/v1`

**WebSocket Hub (Real-time):** `ws://localhost:5000`

---

## 🔐 1. Authorization Guide (For Frontend Developers)

For all protected routes, you must include the JWT token received from the Login/Register endpoints in the `Authorization` header of your HTTP requests.

**Format:**
`Authorization: Bearer <your_jwt_token_here>`

---

## 👤 2. User & Profile Module

### Update Profile

Updates the basic information for the currently authenticated user.

* **Endpoint:** `/users/profile`
* **Method:** `PUT`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "fullName": "John Doe",
  "phone": "08012345678",
  "avatar": "https://url-to-image.com/img.png",
  "dateOfBirth": "1995-08-24",
  "gender": "male"
}

```



---

## 🏪 3. Vendor & KYC Onboarding Module

### Save Business & Bank Info (Step 1)

Saves the initial business details and bank account information for vendors.

* **Endpoint:** `/vendors/profile`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "businessName": "FlowMart Tech Store",
  "cacNo": "RC123456",
  "campCertificateId": "NYSC/123/456",
  "bankName": "Access Bank",
  "accountNumber": "0123456789",
  "accountName": "John Doe"
}

```



### Submit Final KYC Documents (Step 2)

Submits government IDs and guarantor info for final KYC review.

* **Endpoint:** `/vendors/kyc/submit`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "governmentIdType": "national_id",
  "guarantorName": "Jane Doe",
  "guarantorPhone": "08098765432",
  "guarantorRelationship": "Sister",
  "governmentIdUrl": "https://cloud-storage.com/id.jpg",
  "campCertificateUrl": "https://cloud-storage.com/cert.jpg"
}

```



### Get KYC Status

Used by the frontend Onboarding Guard to check if the vendor is approved.

* **Endpoint:** `/vendors/kyc/status`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** Returns `unsubmitted`, `pending`, `under_review`, `approved`, or `rejected` alongside an array of step completions.

---

## 🛒 4. Commerce & Orders Module

> **🔖 Note on Order References:** Whenever displaying an order tracking number to an Attendee, Vendor, or Rider, **always use the `orderRef` property** returned by the API (e.g., `FLW-20261210-4829`). Do not display the UUID.

### Place an Order (Checkout)

* **Endpoint:** `/orders`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "productId": "uuid-here",
  "quantity": 2,
  "zone": "Zone A",
  "payment_method": "bank_transfer", 
  "transaction_reference": "TXN_987654321",
  "payment_proof_url": "https://cloud-storage.com/receipt.jpg"
}

```


*(Note: `payment_method` defaults to `pay_on_delivery` if omitted).*

### Get My Orders

Fetches orders depending on role (Attendees see their purchases; Vendors see orders placed with them).

* **Endpoint:** `/orders`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

### Update Order Status

Used by Vendors or Riders to update the delivery state.

* **Endpoint:** `/orders/:id/status`
* **Method:** `PATCH`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "status": "confirmed" // 'pending', 'confirmed', 'assigned', 'picked_up', 'delivered', 'cancelled'
}

```



---

## ⛑️ 5. Welfare & Logistics Module

### Allocate Welfare (Single Zone)

Assigns welfare items to a specific zone.

* **Endpoint:** `/welfare/allocations`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "eventId": "uuid-event-here",
  "zoneId": "Zone A",
  "totalItems": 500
}

```



### Bulk Allocate Welfare

Assigns welfare items to multiple zones at once.

* **Endpoint:** `/welfare/allocations/bulk`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "eventId": "uuid-event-here",
  "allocations": [
    { "zoneId": "Zone A", "totalItems": 500 },
    { "zoneId": "Zone B", "totalItems": 300 }
  ]
}

```



### Report Welfare Shortage

Used by Dispatch Riders or Zone Coordinators if welfare items are missing upon arrival.

* **Endpoint:** `/welfare/allocations/:id/shortage`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "quantityMissing": 5,
  "shortageDescription": "2 boxes were damaged in transit"
}

```



### Update Welfare Status (Assign Rider / Mark Delivered)

* **Endpoint:** `/welfare/allocations/:id/status`
* **Method:** `PATCH`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "status": "assigned" // or 'delivered'
}

```



---

## 📊 6. Analytics Dashboard Module

### Get Global Dashboard Statistics

Retrieves high-level aggregations of orders, welfare distribution data, and active riders. (Restricted to `super_admin`).

* **Endpoint:** `/analytics`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

### Get User Dashboard Statistics

Retrieves personalized stats for the mobile home screen (e.g., Rider's pending/completed deliveries or Coordinator's alerts).

* **Endpoint:** `/analytics/me`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

---

## 📡 7. Sync Queue Module (Offline Resilience)

### Process Offline Sync Queue

Allows frontend applications (like the Rider mobile app) to send a batch of offline actions to process synchronously when network connectivity is restored.

* **Endpoint:** `/sync`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
```json
{
  "actions": [
    {
      "type": "confirm_delivery",
      "payload": {
        "orderId": "uuid-order-here",
        "pin": "123456"
      }
    }
  ]
}

```



---

## 📧 8. Background Events & Emails

The backend handles asynchronous email dispatch. The frontend **does not** need to wait for these or trigger them manually. They occur automatically during:

* **Registration:** Sends a 6-digit OTP.
* **OTP Verification:** Sends a Welcome Email.
* **Password Reset:** Sends a magic link/token.
* **Placing an Order:** Sends an Order Receipt (with the 6-digit Delivery PIN).
* **Confirming Delivery:** Sends a final Delivery Success receipt.
* **Inventory & Welfare:** Sends alerts to Vendors (Out of Stock) and Coordinators (New Allocations/Bulk Imports).

---

## ⚡ 9. WebSocket Hub (Real-Time Events)

To establish a real-time connection for in-app notifications (e.g., notifying an attendee when a delivery drops), connect using Socket.io and provide the authenticated `userId` as a query parameter.

**Connection Example (Frontend):**

```javascript
import { io } from "socket.io-client";

const socket = io("ws://localhost:5000", {
  query: { userId: "user-uuid-here" }
});

socket.on("notification", (data) => {
  console.log("New Alert:", data);
});
