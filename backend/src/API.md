# FlowMart API Documentation

**Base URL (Local Development):** `http://localhost:5000/api/v1`

---

## Authentication Module

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

**Error Responses:**
- `400 Bad Request`: "All fields are required" or "Email already registered"
- `500 Internal Server Error`

---

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

**Success Response (200 OK):**
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "uuid-string-here",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "attendee"
  }
}

**Error Responses:**
- `400 Bad Request`: "Email and password required"
- `401 Unauthorized`: "Invalid credentials"
- `500 Internal Server Error`

---

## Authorization Guide (For Frontend Developers)

For any future protected routes (e.g., creating a vendor shop, ordering welfare items), you must include the JWT token received from the Login/Register endpoints in the `Authorization` header of your HTTP requests.

**Format:**
Authorization: Bearer <your_jwt_token_here>