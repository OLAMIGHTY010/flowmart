# FlowMart Super App - Software Requirements Specification (SRS)

## 1. Introduction
This document specifies the software architecture, technical stack, and system requirements for the FlowMart Super App. FlowMart is designed as a highly scalable, real-time ecosystem handling e-commerce, logistics, and fintech services.

## 2. System Architecture
We are adopting a **Microservices-oriented Architecture** built on a scalable cloud foundation.

### 2.1. Client Applications
- **Customer App (Web/PWA/Mobile):** React + Vite (current) migrating to React Native/Expo for native mobile experiences.
- **Merchant Dashboard (Web):** React + Vite (current).
- **Rider App (Mobile):** React Native (optimized for low-end devices and GPS background tracking).

### 2.2. Backend Services (Node.js / TypeScript)
- **API Gateway:** Routes requests, handles rate limiting, and unified authentication.
- **Identity & Wallet Service:** Manages user sessions, JWT, RBAC, and ledger entries for the digital wallet.
- **Catalog & Inventory Service:** Manages multi-vertical catalogs (Food, Groceries, General Items).
- **Order & Dispatch Service:** Handles order state machines and geo-routes to nearest riders.
- **AI Service:** Connects to LLMs (OpenAI/Gemini) for the Shopping Assistant and product recommendations.

### 2.3. Database & Caching Layer
- **Primary Database:** PostgreSQL (managed via Drizzle ORM).
- **Geospatial Queries:** PostGIS extension for PostgreSQL to handle "closest to me" queries (e.g., `ST_Distance`).
- **Caching & Pub/Sub:** Redis (up to 10x faster read speeds for active sessions, carts, and real-time rider tracking).
- **Search Engine:** Typesense or Elasticsearch for lightning-fast unified search across all verticals.

## 3. Core Functional Requirements

### 3.1. Authentication & Security
- **REQ-AUTH-01:** System must support OAuth (Google, Apple) and Phone Number (OTP) logins.
- **REQ-AUTH-02:** All merchants must undergo automated KYC checks (BVN/NIN for individuals, CAC for businesses).

### 3.2. Hyperlocal Dispatch System
- **REQ-GEO-01:** System must track rider locations via WebSockets in real-time.
- **REQ-GEO-02:** Orders must auto-assign to the nearest available rider within a 3km radius before expanding the search ring.

### 3.3. Payments & Escrow
- **REQ-FIN-01:** Integration with Paystack/Flutterwave/Monnify for fiat on-ramping and off-ramping.
- **REQ-FIN-02:** The unified wallet must hold funds in Escrow until the customer confirms delivery for marketplace items.

### 3.4. AI Shopping Assistant
- **REQ-AI-01:** The AI must parse natural language to query the Catalog service (e.g., extracting "birthday gift" and "budget < 50k" into SQL parameters).
- **REQ-AI-02:** The AI must build JSON cart objects that can be directly injected into the user's active session.

## 4. Non-Functional Requirements (NFRs)
- **Scalability:** Must support up to 50,000 concurrent users at launch, scaling horizontally via Kubernetes (K8s) or Docker Swarm.
- **Latency:** API response times must be < 200ms (excluding 3rd party API calls).
- **Availability:** Target uptime is 99.99%.
- **Compliance:** Must be fully compliant with NDPR (Nigeria Data Protection Regulation).

## 5. DevOps & Deployment Strategy
- **CI/CD:** GitHub Actions for automated testing (Jest) and deployment.
- **Hosting (Interim):** Vercel (Frontends) + Render/Railway/AWS (Backend services).
- **Monitoring:** Sentry for error tracking, Datadog/NewRelic for APM, and localized logging for audit trails.
