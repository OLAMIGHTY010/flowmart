# FlowMart Feature Expansion Roadmap

This document outlines the strategic phases to build out the major missing functionalities in the FlowMart Super App.

## Strategic Decision: Real Estate & Vehicles
FlowMart will **act as an intermediary and handle transactions/escrow** for Real Estate and Vehicles, rather than just functioning as a basic classifieds board (like Jiji). 
**Why this gives FlowMart an edge:** The biggest issue with high-ticket items in Nigeria is trust and fraud. By offering verified listings and holding funds in Escrow until physical inspection and handover are complete, FlowMart provides a completely safe, scam-free environment. This is a massive competitive advantage.

---

## Implementation Phases

### Phase 1: Tailored Vertical UIs (Food, Pharmacy, Services)
Currently, all verticals point to a generic `Marketplace`. We are giving them distinct user experiences.
* **Food Delivery:** Restaurant Menu components with dish modifiers (e.g., "Add extra cheese"), prep-time estimates, and a unified cart that handles restaurant-specific logistics.
* **Services Booking:** Scheduling component (calendar/time slots) so users can book artisans/services instead of just "adding to cart."
* **Pharmacy:** Prescription upload logic and specialized medication categorizations.

### Phase 2: Escrow Mechanics & Advanced Wallet
The wallet currently exists, but Escrow is crucial for a Super App's trust model.
* **Backend (`wallet.controller.ts` / `order.controller.ts`):** Introduce an `ESCROW` ledger state. When a user pays, funds go to Escrow.
* **Frontend:** Create an Escrow UI in the user profile showing locked funds, and a "Confirm Delivery to Release Funds" button on the Order Tracking page. 
* **Disputes:** Connect the Escrow release to the existing `dispute.controller.ts`.

### Phase 3: Real Estate & Vehicles Verticals
Expand the catalog and frontend to support high-ticket items.
* **Backend:** Extend the `product.controller.ts` to support metadata for properties (bedrooms, bathrooms, square footage) and vehicles (make, model, year, mileage).
* **Frontend:** Create dedicated `RealEstate.tsx` and `Vehicles.tsx` pages with specialized filters and layout (e.g., photo galleries, map views for properties).

### Phase 4: Merchant Marketing Hub (Ads)
Allow vendors to promote their products and see analytics.
* **Backend:** Ensure `ad.controller.ts` has endpoints for creating campaigns, setting budgets, and deducting from the vendor's wallet.
* **Frontend (`vendor/` routes):** Add a `MarketingHub.tsx` page where vendors can boost products, track impressions, clicks, and ROI.

### Phase 5: Community Commerce & Referrals
Drive growth and retention.
* **Backend:** Add a `referral.controller.ts` to generate unique codes and automatically credit wallets upon successful referral purchases.
* **Frontend:** Add a Referrals page in the User Profile to copy links, view referred friends, and track earned bonuses. Add Merchant Subscriptions (follow/subscribe to a vendor).
