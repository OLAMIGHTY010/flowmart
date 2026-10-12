import { fxAutomationService } from '../../services/automation/fx-automation.service';

describe('FxAutomationService', () => {
  it('should return default rates table with NGN base', () => {
    const table = fxAutomationService.getRatesTable();
    expect(table.baseCurrency).toBe('NGN');
    expect(table.rates.USD).toBeGreaterThan(0);
    expect(table.inverseRates.USD).toBe(1600);
    expect(table.platformSpreadPercent).toBe(1.5);
  });

  it('should convert currency with platform spread', () => {
    // 160,000 NGN -> USD (at 1600 rate = 100 USD + 1.5% spread = 101.50 USD)
    const result = fxAutomationService.convertCurrency(160000, 'NGN', 'USD', true);
    expect(result.convertedAmount).toBeCloseTo(101.5, 1);
    expect(result.spreadFee).toBeGreaterThan(0);
  });

  it('should return same amount for identical from and to currency', () => {
    const result = fxAutomationService.convertCurrency(50000, 'NGN', 'NGN');
    expect(result.convertedAmount).toBe(50000);
    expect(result.spreadFee).toBe(0);
  });

  it('should generate diaspora gifting quote with custom gift message', () => {
    const quote = fxAutomationService.createDiasporaGiftingQuote(
      80000, // ₦80,000 cart
      'GBP',
      'Ikeja, Lagos',
      'Nigeria',
      'Happy Birthday Mom from London!'
    );

    expect(quote.isDiasporaOrder).toBe(true);
    expect(quote.targetCurrency).toBe('GBP');
    expect(quote.convertedAmount).toBeGreaterThan(0);
    expect(quote.giftMessage).toBe('Happy Birthday Mom from London!');
  });

  it('should format currency correctly with proper symbol', () => {
    expect(fxAutomationService.formatCurrency(5000, 'NGN')).toContain('₦');
    expect(fxAutomationService.formatCurrency(50, 'USD')).toContain('$');
    expect(fxAutomationService.formatCurrency(40, 'GBP')).toContain('£');
  });

  it('should update rates when sync is triggered', () => {
    const updated = fxAutomationService.syncExchangeRates({ USD: 1650 });
    expect(updated.inverseRates.USD).toBe(1650);
  });
});
