/**
 * ============================================================================
 * REAL-TIME FX EXCHANGE RATE SYNC & MULTI-CURRENCY DIASPORA ENGINE
 * ============================================================================
 *
 * Powers cross-border pan-African and diaspora e-commerce:
 * - Automated multi-currency rate synchronization (NGN, USD, GBP, EUR, KES, GHS, ZAR).
 * - Hedged platform FX spread to protect merchant payouts against devaluation.
 * - Diaspora Gifting calculator: London/NYC buyers paying in GBP/USD for Nigeria delivery.
 * - Millisecond-fast local currency formatting and conversions.
 *
 * @module backend/src/services/automation/fx-automation.service
 */

export type SupportedCurrency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'KES' | 'GHS' | 'ZAR';

export interface ExchangeRateTable {
  baseCurrency: 'NGN';
  rates: Record<SupportedCurrency, number>; // Units of foreign currency per 1 NGN
  inverseRates: Record<SupportedCurrency, number>; // Units of NGN per 1 foreign currency
  platformSpreadPercent: number; // e.g. 1.5%
  lastUpdated: number;
}

export interface DiasporaGiftingQuote {
  cartTotalNgn: number;
  targetCurrency: SupportedCurrency;
  convertedAmount: number;
  fxSpreadFee: number;
  recipientCountry: string;
  recipientCity: string;
  giftMessage?: string;
  isDiasporaOrder: boolean;
}

class FxAutomationService {
  private ratesTable: ExchangeRateTable;

  constructor() {
    this.ratesTable = this.getDefaultRates();
  }

  private getDefaultRates(): ExchangeRateTable {
    // 1 USD ~ 1,600 NGN; 1 GBP ~ 2,050 NGN; 1 EUR ~ 1,730 NGN; 1 KES ~ 12.3 NGN; 1 GHS ~ 102 NGN; 1 ZAR ~ 88 NGN
    return {
      baseCurrency: 'NGN',
      rates: {
        NGN: 1.0,
        USD: 1 / 1600,
        GBP: 1 / 2050,
        EUR: 1 / 1730,
        KES: 1 / 12.3,
        GHS: 1 / 102,
        ZAR: 1 / 88,
      },
      inverseRates: {
        NGN: 1.0,
        USD: 1600,
        GBP: 2050,
        EUR: 1730,
        KES: 12.3,
        GHS: 102,
        ZAR: 88,
      },
      platformSpreadPercent: 1.5,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Syncs latest exchange rates (can be called by cron worker or admin trigger)
   */
  public syncExchangeRates(newRates?: Partial<Record<SupportedCurrency, number>>): ExchangeRateTable {
    if (newRates) {
      for (const [curr, invRate] of Object.entries(newRates)) {
        const c = curr as SupportedCurrency;
        if (invRate && invRate > 0) {
          this.ratesTable.inverseRates[c] = invRate;
          this.ratesTable.rates[c] = 1 / invRate;
        }
      }
    }
    this.ratesTable.lastUpdated = Date.now();
    return this.ratesTable;
  }

  /**
   * Converts an amount from one currency to another
   */
  public convertCurrency(
    amount: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency,
    applySpread = true
  ): { convertedAmount: number; effectiveRate: number; spreadFee: number } {
    if (fromCurrency === toCurrency) {
      return { convertedAmount: amount, effectiveRate: 1.0, spreadFee: 0 };
    }

    // Convert from -> NGN
    const amountInNgn = fromCurrency === 'NGN'
      ? amount
      : amount * this.ratesTable.inverseRates[fromCurrency];

    // Convert NGN -> toCurrency
    const rawConverted = toCurrency === 'NGN'
      ? amountInNgn
      : amountInNgn * this.ratesTable.rates[toCurrency];

    // Apply platform spread
    const spreadMultiplier = applySpread
      ? 1 + this.ratesTable.platformSpreadPercent / 100
      : 1.0;

    const finalAmount = Number((rawConverted * spreadMultiplier).toFixed(2));
    const spreadFee = Number((finalAmount - rawConverted).toFixed(2));
    const effectiveRate = Number((finalAmount / amount).toFixed(4));

    return {
      convertedAmount: finalAmount,
      effectiveRate,
      spreadFee,
    };
  }

  /**
   * Generates a Diaspora Gifting Checkout Quote
   */
  public createDiasporaGiftingQuote(
    cartTotalNgn: number,
    buyerCurrency: SupportedCurrency,
    recipientCity: string,
    recipientCountry = 'Nigeria',
    giftMessage?: string
  ): DiasporaGiftingQuote {
    const conversion = this.convertCurrency(cartTotalNgn, 'NGN', buyerCurrency, true);

    return {
      cartTotalNgn,
      targetCurrency: buyerCurrency,
      convertedAmount: conversion.convertedAmount,
      fxSpreadFee: conversion.spreadFee,
      recipientCountry,
      recipientCity,
      giftMessage,
      isDiasporaOrder: buyerCurrency !== 'NGN',
    };
  }

  /**
   * Formats currency with appropriate ISO symbol
   */
  public formatCurrency(amount: number, currency: SupportedCurrency): string {
    const symbols: Record<SupportedCurrency, string> = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
      EUR: '€',
      KES: 'KSh ',
      GHS: 'GH₵ ',
      ZAR: 'R ',
    };
    return `${symbols[currency]}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  public getRatesTable(): ExchangeRateTable {
    return this.ratesTable;
  }
}

export const fxAutomationService = new FxAutomationService();
