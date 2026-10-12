/**
 * ============================================================================
 * FRONTEND AUTOMATION SERVICE SDK (VENDOR, RIDER, USER & ADMIN)
 * ============================================================================
 *
 * Client API connector for FlowMart's 7 autonomous operational engines:
 * 1. Logistics Cascade & Rider Offers
 * 2. Instant Micro-Dispute Arbitration
 * 3. Abandoned Cart Recovery & Churn Prevention
 * 4. Autonomous Stockout & Reorder Alerts
 * 5. Anti-Fraud Velocity & Quarantine Status
 * 6. Real-Time FX Multi-Currency & Diaspora Gifting Quotes
 * 7. Payout Sweeps & Rolling Reserves
 *
 * @module frontend/src/services/AutomationServices
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/automation`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const automationServices = {
  // Vendor
  async getVendorInventoryAlerts(vendorId?: string) {
    const res = await apiClient.get('/vendor/inventory-alerts', { params: { vendorId } });
    return res.data;
  },

  async getVendorPayouts(vendorId?: string) {
    const res = await apiClient.get('/vendor/payouts', { params: { vendorId } });
    return res.data;
  },

  async getVendorCartRecovery(vendorId?: string) {
    const res = await apiClient.get('/vendor/cart-recovery', { params: { vendorId } });
    return res.data;
  },

  // Rider
  async getRiderActiveOffer(riderId?: string) {
    const res = await apiClient.get('/rider/active-offer', { params: { riderId } });
    return res.data;
  },

  async respondToRiderOffer(dispatchId: string, riderId: string, response: 'ACCEPT' | 'DECLINE') {
    const res = await apiClient.post('/rider/respond', { dispatchId, riderId, response });
    return res.data;
  },

  // User / Buyer
  async arbitrateUserDispute(payload: {
    disputeId: string;
    orderId: string;
    claimAmountNgn: number;
    claimReason: string;
    buyerTrustScore?: number;
    evidencePhotos?: string[];
  }) {
    const res = await apiClient.post('/user/dispute/arbitrate', payload);
    return res.data;
  },

  async convertCurrency(amount: number, from: string, to: string) {
    const res = await apiClient.post('/user/currency/convert', { amount, from, to });
    return res.data;
  },

  async getDiasporaQuote(payload: {
    cartTotalNgn: number;
    buyerCurrency: string;
    recipientCity: string;
    recipientCountry?: string;
    giftMessage?: string;
  }) {
    const res = await apiClient.post('/user/diaspora/quote', payload);
    return res.data;
  },

  // Admin Control Plane
  async getAdminDashboard() {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  async triggerAutonomousHeartbeat() {
    const res = await apiClient.post('/admin/heartbeat');
    return res.data;
  },

  async liftFraudQuarantine(entity: string) {
    const res = await apiClient.post('/admin/fraud/lift-quarantine', { entity });
    return res.data;
  },

  async setMicroDisputeThreshold(thresholdNgn: number) {
    const res = await apiClient.post('/admin/dispute/threshold', { thresholdNgn });
    return res.data;
  },

  async syncExchangeRates(rates?: Record<string, number>) {
    const res = await apiClient.post('/admin/fx/sync', { rates });
    return res.data;
  },
};
