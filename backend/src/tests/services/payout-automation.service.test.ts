import { payoutAutomationService } from '../../services/automation/payout-automation.service';

describe('PayoutAutomationService', () => {
  beforeEach(() => {
    payoutAutomationService.clearAll();
  });

  it('should enqueue delivery payout and hold in inspection window', () => {
    const dis = payoutAutomationService.enqueueDeliveryPayout(
      'order-pay-01',
      'VENDOR',
      'vendor-pay-01',
      { code: '058', account: '0123456789', name: 'Vendor GTBank' },
      100000,
      5000, // ₦5,000 platform fee
      true // requires rolling reserve (5%)
    );

    expect(dis.status).toBe('INSPECTION_HOLD');
    expect(dis.grossAmountNgn).toBe(100000);
    expect(dis.platformFeeNgn).toBe(5000);
    expect(dis.rollingReserveHeldNgn).toBe(5000); // 5%
    expect(dis.netPayoutNgn).toBe(90000); // 100k - 5k - 5k
  });

  it('should freeze payout when dispute is lodged within inspection window', () => {
    payoutAutomationService.enqueueDeliveryPayout(
      'order-pay-02',
      'VENDOR',
      'vendor-pay-02',
      { code: '058', account: '0123456789', name: 'Vendor GTBank' },
      50000,
      2500
    );

    const frozen = payoutAutomationService.freezeDisputedPayout('order-pay-02');
    expect(frozen).toBe(true);

    const stmt = payoutAutomationService.getVendorPayoutStatement('vendor-pay-02');
    expect(stmt.disbursements[0].status).toBe('DISPUTED_FROZEN');
  });

  it('should execute payout sweep after 48h inspection expiry', () => {
    const deliveredTime = Date.now() - 49 * 3600 * 1000; // 49 hours ago (> 48h)
    payoutAutomationService.enqueueDeliveryPayout(
      'order-pay-03',
      'VENDOR',
      'vendor-pay-03',
      { code: '058', account: '0123456789', name: 'Vendor GTBank' },
      80000,
      4000,
      false,
      deliveredTime
    );

    const sweep = payoutAutomationService.processInspectionPayoutSweep(Date.now());
    expect(sweep.sweptCount).toBe(1);
    expect(sweep.totalAmountNgn).toBe(76000);

    const stmt = payoutAutomationService.getVendorPayoutStatement('vendor-pay-03');
    expect(stmt.disbursements[0].status).toBe('PAID');
    expect(stmt.totalPaidNgn).toBe(76000);
  });

  it('should sweep rolling reserves after 7 days', () => {
    const heldTime = Date.now() - 8 * 24 * 3600 * 1000; // 8 days ago (> 7 days)
    payoutAutomationService.enqueueDeliveryPayout(
      'order-pay-04',
      'VENDOR',
      'vendor-pay-04',
      { code: '058', account: '0123456789', name: 'Vendor GTBank' },
      100000,
      5000,
      true,
      heldTime
    );

    const sweep = payoutAutomationService.processRollingReserveSweep(Date.now());
    expect(sweep.releasedCount).toBe(1);
    expect(sweep.totalReleasedNgn).toBe(5000);
  });

  it('should compile admin payout summary', () => {
    payoutAutomationService.enqueueDeliveryPayout(
      'order-pay-05',
      'VENDOR',
      'vendor-pay-05',
      { code: '058', account: '0123456789', name: 'Vendor GTBank' },
      20000,
      1000,
      true
    );

    const summary = payoutAutomationService.getAdminPayoutSummary();
    expect(summary.totalDisbursements).toBe(1);
    expect(summary.pendingInspectionNgn).toBe(18000);
    expect(summary.totalHeldReserveNgn).toBe(1000);
  });
});
