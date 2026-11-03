# FlowMart Comprehensive System Documentation & Changelog

**Platform Version:** 2.0.0 (Post-Sprint Z Zenith Release)  
**Last Updated:** November 2026  
**Architecture Grade:** Chowdeck-Grade High-Concurrency On-Demand Logistics & Super App  

---

## 1. Executive System Overview

FlowMart is a multi-vertical, on-demand commerce and logistics ecosystem engineered for Nigerian and African metropolitan hubs (Lagos, Abuja, Port Harcourt). It integrates an ultra-fast food and grocery delivery engine, multi-party group checkout, courier dispatch optimization, kitchen management systems (KDS), cold-chain transit guarantees, and a high-availability administrative command center.

### Core System Pillars
1. **Customer Experience (CX):** High-conversion ordering, AI voice concierge, multi-stop feasts, synced group carts, FlowPass VIP, and real-time tracking radar.
2. **Courier / Champion Ecosystem:** 3km Redis proximity dispatch, guaranteed hourly floor pay, shift matrices, Tier progression ladders, COD remittance, and Emergency SOS beacon.
3. **Vendor / Kitchen Operations:** Kitchen Display System (KDS) tablet mode, 86'd ingredient auto-replacement, recipe modifier builders, P&L statements, and live prep station hygiene streaming.
4. **Operations & Admin Command:** Autonomous dispatch auto-rerouting, AI proof-of-delivery dispute arbitration, dynamic surge & weather multipliers, cold-chain insurance, and Zenith Mission Control.

---

## 2. Technology Stack & Infrastructure

| Layer | Technologies |
| :--- | :--- |
| **Frontend Web & PWA** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, React Query, HTML5 Canvas / Audio API |
| **Backend API** | Node.js, Express, TypeScript, RESTful architecture, modular route-controller design |
| **Database & ORM** | PostgreSQL, Drizzle ORM, Drizzle Kit migrations |
| **Real-Time & Caching** | Socket.IO (bidirectional driver telemetry, KDS alerts, group cart syncing), Redis (geospatial index, 45s dispatch locks) |
| **Payments & Escrow** | Paystack API, FlowMart Escrow Vault, In-App Multi-Currency Wallet, Split-Bill engine |
| **AI & Telemetry** | Google Gemini / OpenAI NLP (Voice Concierge, Dispute POD image analysis), Zenith Autonomous Health Watchdog |

---

## 3. Comprehensive Changelog: All Sprints & Major Milestones

### **Foundational Architecture Phases (Phases 1 — 5)**
* **Phase 1 (Tailored Vertical UIs):** Distinct checkout flows for Food Delivery, Pharmacy with prescription validation, and Artisan Services booking.
* **Phase 2 (Escrow Mechanics & Wallet):** FlowMart Escrow holding state for user payments, safe-deposit releasing, and dispute management.
* **Phase 3 (Chowdeck-Grade Dispatch):** Redis 3km proximity matching, 45-second courier acceptance countdowns, and Redlock concurrency.
* **Phase 4 (Security & Tenant Isolation):** Row-level tenant isolation, PII phone masking (proxy calling numbers), multi-tier rate limiting, and Edge CDN caching headers.
* **Phase 5 (Automated CI/CD & Verification):** Automated workflow test suites covering dispatch mechanics, Nigerian postcode validations, and privacy enforcement.

---

### **Feature Packs & Alphabet Sprints (Sprints A — Z)**

#### **Sprint A: CX Quick Reorder & Social Payments**
* **Commit:** `b5dd3f2f`
* **Features:**
  * Interactive item customizer drawer with portion and side selections.
  * "Pay For Me" social checkout links for remote sponsor payment.
  * 1-tap "Order Again" button replicating past cart items.

#### **Sprint B: In-App Wallet & Courier Live Chat**
* **Commit:** `a95d292b`
* **Features:**
  * 1-click checkout using FlowMart stored-value in-app wallet.
  * Real-time WebSocket order-linked courier live chat with canned quick replies ("I'm at the gate", "Call when downstairs").

#### **Sprint C: FlowPass VIP & Two-Tier Ratings**
* **Commit:** `f14bd3f6`
* **Features:**
  * FlowPass VIP membership program with free delivery perks and priority dispatch.
  * Two-tier post-delivery rating modal separating Food Quality (Vendor) from Delivery Courtesy (Courier).

#### **Sprint D: Delivery Address Switcher & Social Proof**
* **Commit:** `10399681`
* **Features:**
  * Chowdeck-style floating delivery address pill with instant location switching.
  * Dynamic merchant card ETAs calculated from real-time courier proximity.
  * Live social proof badges ("🔥 42 people ordered this hour").

#### **Pack E: Gamification & Foodie Wrapped**
* **Commit:** `629c48e7`
* **Features:**
  * "Foodie Wrapped" interactive story carousel showing lifetime meal stats and favorite dishes.
  * Post-checkout mystery scratch cards awarding instant delivery vouchers.
  * Viral referral tiers with tier-based wallet cashbacks.

#### **Pack F: Multi-Order Stacked Batching & Proof of Delivery**
* **Commit:** `9d5180de`
* **Features:**
  * Smart multi-order route stacking for couriers on identical delivery corridors.
  * Doorstep camera photo capture for contact-free proof of delivery (POD).
  * 4-digit handover OTP verification preventing delivery misplacement.

#### **Sprint G: Kitchen Display System (KDS) Tablet Mode**
* **Commit:** `d5e2b6ce`
* **Features:**
  * Fullscreen KDS tablet interface for commercial kitchens.
  * Color-coded countdown timers (Green -> Amber -> Red).
  * Web Audio API loud chimes for new incoming orders and ticket status toggles.

#### **Sprint H: Dynamic Zone Surge & Weather Pricing Engine**
* **Commit:** `d47bb53b`
* **Features:**
  * Algorithmic surge pricing based on active order density vs. available couriers.
  * Inclement weather multipliers (Rain, Torrential Flash Floods) with automated driver hazard stipends.
  * Transparent fee breakdown displaying surge multipliers to consumers before payment.

#### **Sprint I: Interactive Route Playback & Proximity Radar**
* **Commit:** `299d331b`
* **Features:**
  * Smooth animated driver transit route visualizer on Leaflet maps.
  * Proximity pulse radar triggering gate arrival audio chime when courier enters 200m radius.

#### **Sprint J: Merchant Statements & Automated Weekly Payout Invoices**
* **Commit:** `f271d4ae`
* **Features:**
  * Comprehensive merchant P&L statements showing gross sales, commission, packaging fees, and net balance.
  * Automated weekly PDF/CSV payout invoices with direct bank settlement reconciliation.

#### **Sprint K: Courier Shift Scheduling & Guaranteed Floor Pay**
* **Commit:** `c41e6cee`
* **Features:**
  * Courier advance shift reservation system across peak lunch and dinner blocks.
  * Guaranteed hourly floor pay engine ensuring minimum earnings even during slow demand.

#### **Sprint L: Live Split-The-Bill Group Checkout Engine**
* **Commit:** `d0cfd65b`
* **Features:**
  * Real-time multi-payer split checkout allowing groups to fund portions of a meal.
  * Dynamic progress bar tracking paid contributions; auto-releases order to kitchen upon 100% funding.

#### **Sprint M: AI Dispatch Dispute Resolution & POD Audit**
* **Commit:** `cb2df12c`
* **Features:**
  * AI-powered dispute review comparing customer claims against courier doorstep photos.
  * Automated instant refund release for validated non-delivery disputes under ₦15,000.

#### **Sprint N: FlowMart AI Voice Order Concierge**
* **Commit:** `d2a8450b`
* **Features:**
  * Real-time microphone audio input visualizer with dynamic audio waveform canvas.
  * Natural language AI intent parser converting voice ("Get me 2 bowls of smokey jollof from The Place and cold malt") directly into a validated cart.

#### **Sprint O: Courier Champion Tier Ladders & Bounties**
* **Commit:** `346203a1`
* **Features:**
  * Tier progression ladders (Rookie -> Bronze -> Silver -> Gold -> Champion).
  * Weekly VIP quest bounties ("Complete 25 weekend deliveries for +₦12,000 bonus").
  * Fuel stipend allowances and priority high-ticket order routing.

#### **Sprint P: Live Ingredient Stock Depletion & 86'd Auto-Replacement**
* **Commit:** `28803ebd`
* **Features:**
  * 1-tap "86 Item" toggles for kitchen managers to immediately take sold-out items off the menu.
  * Automated consumer cart notifications proposing chef-recommended substitutes.

#### **Sprint Q: Live Group Order Room & Multi-Device Synced Cart**
* **Commit:** `989afe40`
* **Features:**
  * Collaborative group order rooms with shareable shortcodes.
  * Bidirectional WebSocket synced cart with live user presence avatars and per-member spending caps.

#### **Sprint R: Interactive Dynamic Island & Proximity Countdown**
* **Commit:** `8129a12f`
* **Features:**
  * Floating dynamic island component adapting between "Order Received", "Kitchen Prepping", "Courier En Route", and "Arrived".
  * Countdown timer with real-time distance and estimated minutes remaining.

#### **Sprint S: Autonomous Dispatch Auto-Rerouting Matrix**
* **Commit:** `d51d5cf9`
* **Features:**
  * Automated incident detection for stalled riders (stationary > 8 mins) or rejected orders.
  * Algorithmic reassignment matrix matching nearest standby courier with zero dispatcher intervention.

#### **Sprint T: Smart Recipe Modifier Configurator**
* **Commit:** `ddffead6`
* **Features:**
  * Merchant recipe customization builder supporting radio single-selects (protein choices) and multi-select add-ons.
  * Live customer preview simulator demonstrating the customer UX in real-time.

#### **Sprint U: Post-Delivery Tipping & Praise Badges**
* **Commit:** `0d91fea4`
* **Features:**
  * Post-delivery tip modal with 100% direct-to-courier payout.
  * Courier Champion praise badges ("Speed Demon", "Careful With Drinks", "Super Polite") visible on rider public profiles.

#### **Sprint V: Automated Cold-Chain & Fragile Safeguards**
* **Commit:** `73fb1d32`
* **Features:**
  * IoT thermal telemetry tracking for temperature-sensitive items (artisan gelato, hot soups, pharmacy biologics).
  * Fragile tilt sensors and vehicle speed governors (< 40 km/h for tiered cakes).
  * Automated zero-spill insurance guarantees with instant customer claims processing.

#### **Sprint W: Live Kitchen Camera Hygiene Portal**
* **Commit:** `e69531e3`
* **Features:**
  * Live kitchen prep station camera streaming directly inside the storefront.
  * Hygiene inspection scores, sanitation checklists, and food safety certifications for consumer confidence.

#### **Sprint X: Multi-Stop Group Feast Courier Routing**
* **Commit:** `b06fbffd`
* **Features:**
  * Dual-merchant cart engine allowing orders from two different nearby vendors in a single checkout.
  * Optimized multi-stop courier waypoint routing and bundled delivery fee discounts.

#### **Sprint Y: Courier Champion Emergency SOS & Roadside Dispatch**
* **Commit:** `5c1b4d3f`
* **Features:**
  * Emergency SOS trigger with 5-second cancel buffer, live GPS distress beacon, and dispatcher alert.
  * Automated roadside mechanic dispatch and emergency cargo handoff to the nearest backup courier.
  * Instant ₦15,000 emergency repair allowance disbursement to rider wallet.

#### **Sprint Z: Zenith Mission Control & Global Kill-Switch Guardrails (The Grand Finale)**
* **Commit:** `b34bff35`
* **Features:**
  * Global high-availability telemetry matrix monitoring 6 core microservice clusters with 99.98% uptime SLA.
  * Operator kill-switch switchboard (Autonomous Autopilot, Extreme Weather Safe-Mode, Payment Gateway Circuit Breaker, AI POD Arbiter, Cold-Chain Governors).
  * 1-click self-healing engine (Flush Redis 3km geo-cache, auto-rebalance fleet surge zones, reconcile escrow ledger, synthetic canary probe).
  * Immutable system event audit ledger with severity filtering (`SUCCESS`, `INFO`, `WARNING`, `CRITICAL`).
  * Emergency Global Safe-Mode lockout modal.

---

## 4. Henceforth Protocol: Development & Documentation Standards

All future engineers and AI contributors must adhere strictly to these rules:

### 1. **Commit Message Format**
Every commit must use conventional prefix syntax:
```bash
feat(<subsystem>): Sprint/Phase <Identifier> - <Concise title describing business value>
fix(<subsystem>): <Root cause fixed and affected module>
perf(<subsystem>): <Performance optimization details>
refactor(<subsystem>): <Non-breaking structural refactoring>
```
*Subsystems:* `cx`, `rider`, `vendor`, `admin`, `dispatch`, `checkout`, `security`, `ci`.

### 2. **Changelog Maintenance**
* Whenever a new phase, feature, or major refactor is created, update this file (`docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md`) immediately.
* Log:
  * Commit SHA and date.
  * Backend controllers and routes added.
  * Frontend components and routing additions.
  * Architectural implications and test verification status.

### 3. **Architectural Guardrails**
* **Tenant Isolation:** Every merchant and courier query must be scoped by tenant/user ID.
* **Geospatial Proximity:** All courier matching must use Redis geodesic indexing within defined 3km radii before expanding.
* **Escrow Integrity:** Funds must never be disbursed directly to merchant or courier balances without verified proof-of-delivery (OTP, photo POD, or automated dispute expiration).
* **High-Impact Circuit Breakers:** Any mission-critical service (payment, auto-dispatch, third-party AI) must include a fallback or kill-switch wired into Zenith Mission Control.
* **Responsive High-Fidelity UI:** All new screens must be tested across mobile viewport (375px+), tablet, and desktop with dark/light theme compatibility.

---

## 5. Directory Structure Reference

```
flowmart/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Business logic (admin, order, rider, vendor, wallet, etc.)
│   │   ├── routes/            # REST API route declarations
│   │   ├── middleware/        # JWT auth, role validation, rate limiters
│   │   ├── services/          # Logistics, dynamic surge, Redis, socket gateways
│   │   ├── db/                # Drizzle schema definitions and migrations
│   │   └── tests/             # Automated test suites
├── frontend/
│   ├── src/
│   │   ├── components/        # Shared UI components (admin, vendor, rider, cx layouts)
│   │   ├── pages/             # Route views (user storefront, rider hub, vendor KDS, admin)
│   │   ├── services/          # API client, websocket pipelines, state management
│   │   ├── hooks/             # Custom React hooks (useAuth, useCart, useLocation)
│   │   └── App.tsx            # Master application router & lazy load declarations
└── docs/                      # Architectural specs, PRD, and changelog records
```

---
*FlowMart Architecture & Engineering Documentation • Copyright © 2026 FlowMart Inc. All Rights Reserved.*
