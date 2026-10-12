import { marketingAutomationService } from '../../services/automation/marketing-automation.service';

describe('MarketingAutomationService', () => {
  beforeEach(() => {
    marketingAutomationService.clearAll();
  });

  it('should register and advance abandoned cart stages', () => {
    const baseTime = Date.now();
    const cart = marketingAutomationService.registerAbandonedCart(
      'cart-001',
      'user-001',
      'test@flowmart.com',
      '+2348011112222',
      [
        {
          productId: 'prod-01',
          productTitle: 'Sneakers Nike Air',
          vendorId: 'vendor-01',
          priceNgn: 45000,
          quantity: 1,
        },
      ],
      45000,
      baseTime - 2 * 3600 * 1000 // 2 hours ago
    );

    expect(cart.stage).toBe('ABANDONED');

    // Process drips after 2 hours
    const result1 = marketingAutomationService.processAbandonedCartDrips(baseTime);
    expect(result1.stage1Sent).toBe(1);
    expect(cart.stage).toBe('STAGE_1_SENT');

    // Simulate 26 hours passing
    cart.abandonedAt = baseTime - 26 * 3600 * 1000;
    const result2 = marketingAutomationService.processAbandonedCartDrips(baseTime);
    expect(result2.stage2Sent).toBe(1);
    expect(cart.stage).toBe('STAGE_2_SENT');
    expect(cart.recoveryCouponCode).toBeDefined();
  });

  it('should mark abandoned cart as recovered', () => {
    marketingAutomationService.registerAbandonedCart(
      'cart-002',
      'user-002',
      'user2@flowmart.com',
      '+2348022223333',
      [
        {
          productId: 'prod-02',
          productTitle: 'Wireless Earbuds',
          vendorId: 'vendor-01',
          priceNgn: 20000,
          quantity: 2,
        },
      ],
      40000
    );

    const recovered = marketingAutomationService.markCartRecovered('cart-002', 'order-rec-01');
    expect(recovered).toBe(true);

    const vendorMetrics = marketingAutomationService.getVendorCartRecoveryMetrics('vendor-01');
    expect(vendorMetrics.recoveredValueNgn).toBe(40000);
    expect(vendorMetrics.recoveryRatePercent).toBe(100);
  });

  it('should evaluate churn triggers and generate discount coupons for at-risk customers', () => {
    const trigger = marketingAutomationService.evaluateCustomerChurnRisk(
      'user-at-risk-01',
      'AT_RISK',
      45
    );

    expect(trigger.campaignAction).toBe('FREE_DELIVERY_TOKEN');
    expect(trigger.voucherCode).toContain('FREEDEL-');

    const hibernatingTrigger = marketingAutomationService.evaluateCustomerChurnRisk(
      'user-hibernating-02',
      'HIBERNATING',
      90
    );

    expect(hibernatingTrigger.campaignAction).toBe('PERCENT_OFF_10');
    expect(hibernatingTrigger.voucherCode).toContain('COMEBACK10-');
  });

  it('should compile admin marketing metrics', () => {
    marketingAutomationService.registerAbandonedCart(
      'cart-003',
      'user-003',
      'u3@flowmart.com',
      '+2348033334444',
      [],
      15000
    );

    const metrics = marketingAutomationService.getAdminMarketingMetrics();
    expect(metrics.totalAbandonedCartsTracked).toBe(1);
    expect(metrics.potentialLostRevenueNgn).toBe(15000);
  });
});
