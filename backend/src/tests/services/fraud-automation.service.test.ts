import { fraudAutomationService } from '../../services/automation/fraud-automation.service';

describe('FraudAutomationService', () => {
  beforeEach(() => {
    fraudAutomationService.clearAll();
  });

  it('should allow normal transaction velocity', () => {
    const result = fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-001',
      userId: 'user-001',
      ipAddress: '102.89.23.1',
      deviceFingerprint: 'device-abc-123',
      amountNgn: 15000,
      paymentStatus: 'SUCCESS',
      timestamp: Date.now(),
    });

    expect(result.allowed).toBe(true);
    expect(result.action).toBe('ALLOW');
    expect(result.riskScore).toBeLessThan(0.3);
  });

  it('should trigger quarantine freeze if transaction velocity burst occurs', () => {
    const now = Date.now();
    const ip = '102.89.99.99';
    const user = 'user-burst-99';

    // 4 rapid attempts in under 2 minutes
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-b-1',
      userId: user,
      ipAddress: ip,
      deviceFingerprint: 'fp-1',
      amountNgn: 5000,
      paymentStatus: 'SUCCESS',
      timestamp: now - 30000,
    });
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-b-2',
      userId: user,
      ipAddress: ip,
      deviceFingerprint: 'fp-1',
      amountNgn: 5000,
      paymentStatus: 'SUCCESS',
      timestamp: now - 20000,
    });
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-b-3',
      userId: user,
      ipAddress: ip,
      deviceFingerprint: 'fp-1',
      amountNgn: 5000,
      paymentStatus: 'SUCCESS',
      timestamp: now - 10000,
    });

    const fourth = fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-b-4',
      userId: user,
      ipAddress: ip,
      deviceFingerprint: 'fp-1',
      amountNgn: 5000,
      paymentStatus: 'SUCCESS',
      timestamp: now,
    });

    expect(fourth.allowed).toBe(false);
    expect(fourth.action).toBe('QUARANTINE_FREEZE');
    expect(fourth.riskScore).toBeGreaterThan(0.9);
  });

  it('should require 2FA step-up on multiple card declines', () => {
    const now = Date.now();
    const user = 'user-decline-01';

    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-d-1',
      userId: user,
      ipAddress: '197.210.5.1',
      deviceFingerprint: 'fp-d',
      amountNgn: 10000,
      paymentStatus: 'DECLINED',
      timestamp: now - 10000,
    });

    const second = fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 'tx-d-2',
      userId: user,
      ipAddress: '197.210.5.1',
      deviceFingerprint: 'fp-d',
      amountNgn: 10000,
      paymentStatus: 'DECLINED',
      timestamp: now,
    });

    expect(second.allowed).toBe(false);
    expect(second.action).toBe('STEP_UP_2FA');
  });

  it('should detect Sybil referral collisions on matching device or IP', () => {
    const deviceCheck = fraudAutomationService.evaluateReferralSybil(
      'ref-001',
      'ref-002',
      '105.112.1.1',
      '105.112.2.2',
      'hardware-id-iphone-13-uuid',
      'hardware-id-iphone-13-uuid'
    );
    expect(deviceCheck.isSybilFraud).toBe(true);

    const ipCheck = fraudAutomationService.evaluateReferralSybil(
      'ref-003',
      'ref-004',
      '197.210.8.8',
      '197.210.8.8',
      'device-a',
      'device-b'
    );
    expect(ipCheck.isSybilFraud).toBe(true);
  });

  it('should allow admin to lift quarantine', () => {
    const ip = '102.89.1.2';
    // Artificially trigger quarantine
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 't1',
      userId: 'u1',
      ipAddress: ip,
      deviceFingerprint: 'd1',
      amountNgn: 100,
      paymentStatus: 'SUCCESS',
      timestamp: Date.now(),
    });
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 't2',
      userId: 'u1',
      ipAddress: ip,
      deviceFingerprint: 'd1',
      amountNgn: 100,
      paymentStatus: 'SUCCESS',
      timestamp: Date.now(),
    });
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 't3',
      userId: 'u1',
      ipAddress: ip,
      deviceFingerprint: 'd1',
      amountNgn: 100,
      paymentStatus: 'SUCCESS',
      timestamp: Date.now(),
    });
    fraudAutomationService.evaluateTransactionVelocity({
      transactionId: 't4',
      userId: 'u1',
      ipAddress: ip,
      deviceFingerprint: 'd1',
      amountNgn: 100,
      paymentStatus: 'SUCCESS',
      timestamp: Date.now(),
    });

    const lifted = fraudAutomationService.liftQuarantine(ip);
    expect(lifted).toBe(true);
  });
});
