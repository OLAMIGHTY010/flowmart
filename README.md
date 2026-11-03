# FlowMart Super App & On-Demand Logistics Ecosystem

[![Version](https://img.shields.io/badge/version-2.0.0-indigo.svg)](https://github.com/OLAMIGHTY010/flowmart)
[![Architecture](https://img.shields.io/badge/architecture-Chowdeck--Grade-emerald.svg)](docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Uptime SLA](https://img.shields.io/badge/SLA-99.98%25-cyan.svg)](docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md)

FlowMart is a full-featured on-demand commerce and logistics platform engineered for African metropolitan markets. It combines an ultra-fast food delivery experience, collaborative group checkouts, real-time courier telemetry, merchant Kitchen Display Systems (KDS), cold-chain fragile safeguards, and an autonomous mission control command center.

---

## 📚 Complete Project Documentation

* **[Full System Documentation & All Sprints Changelog (A → Z)](docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md)**: Exhaustive breakdown of all 26 feature sprints, backend architecture, and future development guidelines.
* **[Implementation Roadmap](docs/IMPLEMENTATION_ROADMAP.md)**: Strategic expansion phases for High-Ticket Escrow (Real Estate & Vehicles), Marketing Hub, and Referrals.
* **[Postcode Integration Guide](docs/POSTCODE_INTEGRATION.md)**: Geofencing, zone surge multipliers, and delivery boundary algorithms.
* **[Product Requirements Document (PRD)](docs/FlowMart_PRD.md)**: Core functional requirements and platform personas.

---

## ⚡ Quick Start

### Prerequisites
* **Node.js** v18+ 
* **npm** or **pnpm**
* **PostgreSQL** instance (local or hosted)
* **Redis** (optional in local dev, recommended for geospatial proximity matching)

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your environment variables (.env)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

---

## 🚀 Key Subsystems & Portals

| Subsystem | Portal Route | Primary Features |
| :--- | :--- | :--- |
| **Customer Storefront** | `/` | AI Voice Concierge, Multi-stop Feasts, Group Ordering Room, Split-the-Bill, 1-Click Wallet Checkout, Dynamic Island Tracking |
| **Courier / Champion Hub** | `/rider/dashboard` | Shift reservation, 3km proximity radar, Guaranteed floor pay, SOS Emergency Beacon, Doorstep photo POD & OTP handover |
| **Kitchen Merchant Portal** | `/vendor/dashboard` | Fullscreen KDS tablet mode, Audio order chimes, 86'd inventory fast toggles, Prep delay buffer, P&L statements |
| **Zenith Mission Control** | `/admin/zenith` | Real-time microservice telemetry, Operator kill-switches, 1-tap self-healing engine, Immutable audit ledger |

---

## 📜 Development & Contribution Protocol

Please consult the **[Henceforth Protocol](docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md#4-henceforth-protocol-development--documentation-standards)** before introducing new commits or architectural modifications.

* Every commit must use conventional commit prefixes: `feat(<domain>): ...`, `fix(<domain>): ...`.
* All new features must update `docs/PROJECT_DOCUMENTATION_AND_CHANGELOG.md`.

---
*FlowMart Super App • Copyright © 2026 FlowMart Inc. All Rights Reserved.*

