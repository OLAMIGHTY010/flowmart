/**
 * ============================================================================
 * UNIT TESTS: EVENT-DRIVEN WEBHOOK & PARTNER INTEGRATION BUS
 * ============================================================================
 */

import { webhookBusService } from '../../services/infrastructure/webhook-bus.service';

describe('WebhookBusService (Event-Driven Partner Bus)', () => {
  let subId: string;

  beforeAll(() => {
    const sub = webhookBusService.registerSubscription(
      'gig-logistics',
      'GIG Logistics Partner',
      'mock://api.gig.com/webhook',
      ['order.dispatched', 'order.delivered'],
      'gig_secret_key_12345'
    );
    subId = sub.id;
  });

  describe('1. Subscription Registration & Cryptographic Signatures', () => {
    it('registers partner subscription with secret key and subscribed events', () => {
      const sub = webhookBusService.getSubscription(subId);
      expect(sub).toBeDefined();
      expect(sub?.partnerName).toBe('GIG Logistics Partner');
      expect(sub?.isActive).toBe(true);
      expect(sub?.subscribedEvents).toContain('order.dispatched');
    });

    it('generates deterministic HMAC-SHA256 signature', () => {
      const payload = JSON.stringify({ orderId: 'ord-100', status: 'dispatched' });
      const sig1 = webhookBusService.computeSignature(payload, 'secret123');
      const sig2 = webhookBusService.computeSignature(payload, 'secret123');
      const sigDiff = webhookBusService.computeSignature(payload, 'secret456');

      expect(sig1).toBe(sig2);
      expect(sig1).not.toBe(sigDiff);
      expect(sig1.length).toBe(64); // Hex length of SHA256
    });
  });

  describe('2. Event Publishing & Routing', () => {
    it('dispatches matched events to registered subscribers', async () => {
      const logs = await webhookBusService.publishEvent('order.dispatched', {
        orderId: 'ord-999',
        trackingNumber: 'FM-TRK-777',
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].eventType).toBe('order.dispatched');
      expect(logs[0].signature).toBeTruthy();
      expect(logs[0].status).toBe('DELIVERED');
    });

    it('does not dispatch events partner did not subscribe to', async () => {
      const logs = await webhookBusService.publishEvent('dispute.opened', {
        disputeId: 'disp-555',
      });

      const gigLog = logs.find((l) => l.subscriptionId === subId);
      expect(gigLog).toBeUndefined();
    });
  });
});
