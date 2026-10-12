/**
 * ============================================================================
 * UNIT TESTS: LOCALIZED SMS & WHATSAPP GATEWAY (TERMII & AFRICA'S TALKING)
 * ============================================================================
 */

import { smsGatewayService } from '../../services/notifications/sms-gateway.service';

describe('SmsGatewayService (Termii & Africa\'s Talking)', () => {
  describe('1. Delivery OTP Handover Dispatch', () => {
    it('dispatches 6-digit delivery confirmation OTP successfully', async () => {
      const res = await smsGatewayService.sendDeliveryOtp('08031234567', '482910', 'order-abc-123');

      expect(res.success).toBe(true);
      expect(res.recipient).toBe('2348031234567');
      expect(res.messageId).toBeTruthy();
      expect(res.channel).toBe('SMS');
      expect(res.deliveredAt).toBeTruthy();
    });
  });

  describe('2. Rider Job Alert Notification', () => {
    it('sends pickup location and order details to rider', async () => {
      const res = await smsGatewayService.sendRiderJobAlert(
        '09029876543',
        'order-xyz-789',
        'Mega Plaza Groceries',
        '14 Idowu Martins St, VI'
      );

      expect(res.success).toBe(true);
      expect(res.recipient).toBe('2349029876543');
      expect(res.provider).toBeDefined();
    });
  });

  describe('3. Escrow Release Alert', () => {
    it('sends escrow payout disbursement confirmation to vendor', async () => {
      const res = await smsGatewayService.sendEscrowDisbursementAlert(
        '07011223344',
        185000,
        'order-escrow-456',
        'WHATSAPP'
      );

      expect(res.success).toBe(true);
      expect(res.channel).toBe('WHATSAPP');
      expect(res.recipient).toBe('2347011223344');
    });
  });
});
