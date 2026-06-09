# FlowMart API Documentation

**Base URL (Local Development):** `http://localhost:5000/api/v1`
**WebSocket Hub (Real-time):** `ws://localhost:5000`

---

## 🔐 Authorization Guide (For Frontend Developers)

For all protected routes, you must include the JWT token received from the Login/Register endpoints in the `Authorization` header of your HTTP requests.

**Format:**
Authorization: Bearer <your_jwt_token_here>

---

## 👤 Authentication Module

### 1. Register a New User
Creates a new user account and returns an access token.

- **Endpoint:** `/auth/register`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

**Request Body:**
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "attendee" 
}

*(Note: `role` is optional and defaults to `attendee`. Valid roles: `super_admin`, `camp_logistics_coordinator`, `zone_coordinator`, `vendor`, `dispatch_rider`, `attendee`)*

**Success Response (201 Created):**
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid-string-here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "attendee"
  }
}

### 2. Login User
Authenticates an existing user and returns an access token.

- **Endpoint:** `/auth/login`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

**Request Body:**
{
  "email": "john@example.com",
  "password": "securepassword123"
}

---

## 🛒 Marketplace & Product Module

### 1. Get Available Products
Fetches all products currently in stock. (Accessible to all authenticated users).

- **Endpoint:** `/products`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 2. Create a Product
Uploads a new product to the marketplace. (Restricted to `vendor` or `super_admin`).

- **Endpoint:** `/products`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "name": "Camp Bottled Water",
  "description": "Pack of 12 chilled water bottles",
  "price": "1500.00",
  "stockQuantity": 50,
  "imageUrl": "https://link-to-image.com/water.jpg"
}

### 3. Update Product & Inventory
Updates product details or stock counts. (Restricted to the `vendor` who owns the item).

- **Endpoint:** `/products/:id`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

### 4. Delete a Product
Removes a product entirely. (Restricted to the `vendor` who owns the item).

- **Endpoint:** `/products/:id`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>`

---

## 📦 Order & Commerce Module

### 1. Place an Order
Purchases an item, generates a delivery PIN, and deducts from vendor inventory. (Restricted to `attendee`).

- **Endpoint:** `/orders`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "productId": "uuid-of-product-here",
  "quantity": 2,
  "deliveryZone": "Zone 4, Parish A"
}

### 2. View Order History
Returns order history. Attendees see their purchases; Vendors see orders placed at their shop. 

- **Endpoint:** `/orders`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 3. Update Order Status
Updates fulfillment progress (e.g., 'confirmed', 'cancelled'). (Restricted to `vendor` and `super_admin`).

- **Endpoint:** `/orders/:id/status`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "status": "confirmed"
}

---

## 🏍️ Logistics & Rider Module

### 1. Get Available Deliveries
Fetches orders that vendors have confirmed but lack a rider. (Restricted to `dispatch_rider`, `super_admin`).

- **Endpoint:** `/riders/available`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 2. Accept a Delivery
Assigns the logged-in rider to a specific order. (Restricted to `dispatch_rider`, `super_admin`).

- **Endpoint:** `/riders/:id/accept`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`

### 3. Confirm Delivery (Manual PIN)
Completes the delivery using the 6-digit PIN provided by the attendee. (Restricted to `dispatch_rider`, `super_admin`).

- **Endpoint:** `/riders/:id/confirm`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "pin": "123456"
}

### 4. Confirm Delivery (QR Scan)
Completes the delivery by submitting the decoded JSON string from the attendee's QR code. (Restricted to `dispatch_rider`, `super_admin`).

- **Endpoint:** `/riders/qr-confirm`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "scannedPayload": "{\"orderId\": \"uuid-string-here\", \"pin\": \"123456\"}"
}

---

## 🤝 Welfare & Allocation Module

### 1. Create Welfare Event
Creates a new welfare distribution tracking event. (Restricted to `super_admin`, `camp_logistics_coordinator`).

- **Endpoint:** `/welfare/events`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "name": "Holy Ghost Congress Welfare Pack",
  "date": "2026-12-10T00:00:00.000Z"
}

### 2. Allocate Welfare to Zone
Assigns item counts to a specific camp zone. (Restricted to `super_admin`, `camp_logistics_coordinator`).

- **Endpoint:** `/welfare/allocations`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
{
  "eventId": "uuid-event-here",
  "zoneId": "Zone 4",
  "totalItems": 500
}

### 3. Get Welfare Reports
Retrieves the real-time allocation and distribution data. (Restricted to `super_admin`, `camp_logistics_coordinator`).

- **Endpoint:** `/welfare/reports`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 📡 Sync Queue Module (Offline Resilience)

### 1. Process Offline Sync Queue
Allows frontend applications to send a batch of offline actions to process synchronously when network connectivity is restored.

- **Endpoint:** `/sync`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Request Body:**
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

---

## 📊 Analytics Dashboard Module

### 1. Get Dashboard Statistics
Retrieves high-level aggregations of orders and welfare distribution data. (Restricted to `super_admin`).

- **Endpoint:** `/analytics`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

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
