# FlowMart API Documentation

**Base URL (Local Development):** `http://localhost:5000/api/v1`  
**WebSocket Hub (Real-time):** `ws://localhost:5000`

---

## 🔐 Authorization Guide (For Frontend Developers)

For all protected routes, you must include the JWT token received from the Login/Register endpoints in the `Authorization` header of your HTTP requests.

**Format:**
`Authorization: Bearer <your_jwt_token_here>`

---

## 📧 Note on Transactional Emails
The backend now handles asynchronous email dispatch. The frontend **does not** need to wait for these or trigger them manually. They occur automatically during:
* **Registration:** Sends a 6-digit OTP.
* **OTP Verification:** Sends a Welcome Email.
* **Password Reset:** Sends a magic link/token.
* **Placing an Order:** Sends an Order Receipt (with the 6-digit Delivery PIN).
* **Confirming Delivery:** Sends a final Delivery Success receipt.
* **Inventory & Welfare:** Sends alerts to Vendors (Out of Stock) and Coordinators (New Allocations/Bulk Imports).

---

## 🔖 Note on Order References (`FLW-YYYYMMDD-XXXX`)
Whenever displaying an order tracking number to an Attendee, Vendor, or Rider, **always use the `orderRef` property** returned by the API (e.g., `FLW-20261210-4829`). Do not display the standard database UUID (`id`) to the end users, as the `orderRef` standardizes communication across all roles. 

---

## 👤 Authentication Module

### 1. Register a New User (Step 1)
Creates an unverified user account and emails a 6-digit OTP. **Does not return a JWT.**

- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "attendee" 
}

```

*(Note: `role` is optional and defaults to `attendee`. **Valid Public Roles:** `attendee`, `vendor`, `dispatch_rider`. For security reasons, institutional roles like `super_admin` or `zone_coordinator` cannot be self-selected and must be assigned via the Admin gateway).*

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the verification code."
}

```

### 2. Verify OTP (Step 2)

Verifies the OTP sent to the user's email. If successful, activates the account and returns the JWT.

* **Endpoint:** `/auth/verify-otp`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}

```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Account verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid-string-here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "attendee"
  }
}

```

### 3. Login User

Authenticates an existing, *verified* user and returns an access token.

* **Endpoint:** `/auth/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}

```

### 4. Request Password Reset

Generates a secure token and emails a reset link to the user.

* **Endpoint:** `/auth/request-reset`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "email": "john@example.com"
}

```

### 5. Reset Password

Consumes the token from the email link and updates the user's password.

* **Endpoint:** `/auth/reset-password`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "token": "32-byte-hex-string-from-url",
  "newPassword": "mynewsecurepassword123"
}

```

### 6. Assign User Role (Admin Only)

Upgrades or assigns a specific system role to an existing user.

* **Endpoint:** `/auth/assign-role`
* **Method:** `PATCH`
* **Headers:** `Authorization: Bearer <super_admin_token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "userId": "uuid-string-here",
  "newRole": "camp_logistics_coordinator"
}

```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User role successfully updated to camp_logistics_coordinator",
  "user": {
    "id": "uuid-string-here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "camp_logistics_coordinator"
  }
}

```

---

## 🛒 Marketplace & Product Module

### 1. Get Available Products

Fetches all products currently in stock. (Accessible to all authenticated users).

* **Endpoint:** `/products`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

### 2. Create a Product

Uploads a new product to the marketplace. (Restricted to `vendor` or `super_admin`).

* **Endpoint:** `/products`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Camp Bottled Water",
  "description": "Pack of 12 chilled water bottles",
  "price": "1500.00",
  "stockQuantity": 50,
  "imageUrl": "[https://link-to-image.com/water.jpg](https://link-to-image.com/water.jpg)"
}

```

### 3. Update Product & Inventory

Updates product details or stock counts. (Restricted to the `vendor` who owns the item).

* **Endpoint:** `/products/:id`
* **Method:** `PUT`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

### 4. Delete a Product

Removes a product entirely. (Restricted to the `vendor` who owns the item).

* **Endpoint:** `/products/:id`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <token>`

---

## 📦 Order & Commerce Module

### 1. Place an Order

Purchases an item, generates a delivery PIN, standardizes the `orderRef`, deducts inventory, and emails a receipt. (Restricted to `attendee`).

* **Endpoint:** `/orders`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "productId": "uuid-of-product-here",
  "quantity": 2,
  "deliveryZone": "Zone 4, Parish A"
}

```

### 2. View Order History

Returns order history. Attendees see their purchases; Vendors see orders placed at their shop.

* **Endpoint:** `/orders`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

### 3. Update Order Status

Updates fulfillment progress (e.g., 'confirmed', 'cancelled'). (Restricted to `vendor` and `super_admin`).

* **Endpoint:** `/orders/:id/status`
* **Method:** `PATCH`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "status": "confirmed"
}

```

---

## 🏍️ Logistics & Rider Module

### 1. Get Available Deliveries

Fetches orders that vendors have confirmed but lack a rider. (Restricted to `dispatch_rider`, `super_admin`).

* **Endpoint:** `/riders/available`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

### 2. Accept a Delivery

Assigns the logged-in rider to a specific order. (Restricted to `dispatch_rider`, `super_admin`).

* **Endpoint:** `/riders/:id/accept`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`

### 3. Confirm Delivery (Manual PIN)

Completes the delivery using the 6-digit PIN provided by the attendee. Triggers a delivery confirmation email. (Restricted to `dispatch_rider`, `super_admin`).

* **Endpoint:** `/riders/:id/confirm`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "pin": "123456"
}

```

### 4. Confirm Delivery (QR Scan)

Completes the delivery by submitting the decoded JSON string from the attendee's QR code. (Restricted to `dispatch_rider`, `super_admin`).

* **Endpoint:** `/riders/qr-confirm`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "scannedPayload": "{\"orderId\": \"uuid-string-here\", \"pin\": \"123456\"}"
}

```

---

## 🤝 Welfare & Allocation Module

### 1. Create Welfare Event

Creates a new welfare distribution tracking event. (Restricted to `super_admin`, `camp_logistics_coordinator`).

* **Endpoint:** `/welfare/events`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Holy Ghost Congress Welfare Pack",
  "date": "2026-12-10T00:00:00.000Z"
}

```

### 2. Allocate Welfare to Zone (Single)

Assigns item counts to a specific camp zone and emails the Zone Coordinator. (Restricted to `super_admin`, `camp_logistics_coordinator`).

* **Endpoint:** `/welfare/allocations`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "eventId": "uuid-event-here",
  "zoneId": "Zone 4",
  "totalItems": 500
}

```

### 3. Bulk Allocate Welfare to Multiple Zones (CSV Import)

Allows bulk insertion of distribution data for multiple zones in a single request. Sends one summary email to the coordinator. (Restricted to `super_admin`, `camp_logistics_coordinator`).

* **Endpoint:** `/welfare/allocations/bulk`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

```json
{
  "eventId": "uuid-event-here",
  "allocations": [
    { "zoneId": "Zone 1", "totalItems": 500 },
    { "zoneId": "Zone 2", "totalItems": 1200 },
    { "zoneId": "Zone 3", "totalItems": 850 }
  ]
}

```

### 4. Get Welfare Reports

Retrieves the real-time allocation and distribution data. (Restricted to `super_admin`, `camp_logistics_coordinator`).

* **Endpoint:** `/welfare/reports`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

---

## 📡 Sync Queue Module (Offline Resilience)

### 1. Process Offline Sync Queue

Allows frontend applications to send a batch of offline actions to process synchronously when network connectivity is restored.

* **Endpoint:** `/sync`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**

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

## 📊 Analytics Dashboard Module

### 1. Get Dashboard Statistics

Retrieves high-level aggregations of orders and welfare distribution data. (Restricted to `super_admin`).

* **Endpoint:** `/analytics`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>`

---

## ⚡ WebSocket Hub (Real-Time Events)

To establish a real-time connection for in-app notifications (e.g., notifying an attendee when a delivery drops), connect using Socket.io and provide the authenticated `userId` as a query parameter.

**Connection String:**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  query: { userId: "uuid-user-id-here" }
});

// Example Event Listener:
socket.on("order.delivered", (data) => {
  console.log("Your order was delivered:", data.orderId);
});
