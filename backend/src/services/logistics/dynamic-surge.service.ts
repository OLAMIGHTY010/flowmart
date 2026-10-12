/**
 * ============================================================================
 * DYNAMIC SURGE & WEATHER-ADAPTIVE LOGISTICS PRICING ENGINE
 * ============================================================================
 *
 * Implements:
 * 1. Precipitation & Storm Severity Multiplier (Weather API sync)
 * 2. Peak Traffic Hours Congestion Premium (Morning & Evening rush)
 * 3. Rider Supply-to-Demand Elasticity Balancing
 * 4. Fair Pricing Ceiling Cap (Prevents price gouging)
 * 5. Rider Incentive Bonus Allocation (80% surge shared with rider)
 *
 * @module backend/src/services/logistics/dynamic-surge.service
 */

export interface SurgePricingContext {
  baseFeeNgn: number;
  deliveryZone: string;
  weatherCondition?: 'CLEAR' | 'DRIZZLE' | 'RAIN' | 'THUNDERSTORM';
  hourOfDay?: number; // 0 - 23
  activeRidersCount?: number;
  pendingOrdersCount?: number;
}

export interface DynamicSurgeResult {
  baseFeeNgn: number;
  surgeMultiplier: number; // e.g. 1.0x - 2.2x
  surgeSurchargeNgn: number;
  finalDeliveryFeeNgn: number;
  riderPayoutNgn: number;
  platformCommissionNgn: number;
  appliedFactors: {
    weatherFactor: number;
    rushHourFactor: number;
    supplyDemandFactor: number;
  };
  surgeReason: string;
  isSurgeActive: boolean;
}

export class DynamicSurgeService {
  private static readonly MAX_SURGE_CEILING = 2.2; // Maximum 2.2x cap

  /**
   * Calculate real-time dynamic logistics fee
   */
  public calculateDynamicFee(ctx: SurgePricingContext): DynamicSurgeResult {
    const baseFee = Math.max(1000, ctx.baseFeeNgn || 1200);
    const hour = ctx.hourOfDay !== undefined ? ctx.hourOfDay : new Date().getHours();

    // 1. Weather Multiplier
    let weatherFactor = 1.0;
    const cond = (ctx.weatherCondition || 'CLEAR').toUpperCase();
    if (cond === 'THUNDERSTORM') weatherFactor = 1.45;
    else if (cond === 'RAIN') weatherFactor = 1.35;
    else if (cond === 'DRIZZLE') weatherFactor = 1.15;

    // 2. Rush Hour Factor (Lagos / Abuja peaks)
    let rushHourFactor = 1.0;
    if (hour >= 8 && hour <= 10) {
      rushHourFactor = 1.2; // Morning commute
    } else if (hour >= 17 && hour <= 20) {
      rushHourFactor = 1.25; // Evening peak gridlock
    }

    // 3. Supply / Demand Imbalance Factor
    let supplyDemandFactor = 1.0;
    const riders = ctx.activeRidersCount || 10;
    const pending = ctx.pendingOrdersCount || 8;
    const ratio = riders / Math.max(1, pending);

    if (ratio < 0.4) {
      supplyDemandFactor = 1.3; // Critical rider shortage
    } else if (ratio < 0.8) {
      supplyDemandFactor = 1.15; // Moderate scarcity
    }

    // Combined Raw Multiplier
    const rawMultiplier = weatherFactor * rushHourFactor * supplyDemandFactor;
    const surgeMultiplier = Number(Math.min(DynamicSurgeService.MAX_SURGE_CEILING, rawMultiplier).toFixed(2));
    const isSurgeActive = surgeMultiplier > 1.05;

    const finalFee = Math.round(baseFee * surgeMultiplier);
    const surcharge = finalFee - baseFee;

    // 80% of surcharge + 75% of base fee goes to the rider
    const riderSurgeBonus = Math.round(surcharge * 0.8);
    const riderBasePayout = Math.round(baseFee * 0.75);
    const riderPayoutNgn = riderBasePayout + riderSurgeBonus;
    const platformCommissionNgn = finalFee - riderPayoutNgn;

    // Formulate descriptive explanation
    const reasons: string[] = [];
    if (weatherFactor > 1.0) reasons.push(`${cond} weather conditions`);
    if (rushHourFactor > 1.0) reasons.push('peak commute traffic');
    if (supplyDemandFactor > 1.0) reasons.push('high order density in zone');

    const surgeReason = isSurgeActive
      ? `Dynamic surge applied due to ${reasons.join(' and ')}.`
      : 'Standard baseline logistics pricing active.';

    return {
      baseFeeNgn: baseFee,
      surgeMultiplier,
      surgeSurchargeNgn: surcharge,
      finalDeliveryFeeNgn: finalFee,
      riderPayoutNgn,
      platformCommissionNgn,
      appliedFactors: {
        weatherFactor,
        rushHourFactor,
        supplyDemandFactor,
      },
      surgeReason,
      isSurgeActive,
    };
  }
}

export const dynamicSurgeService = new DynamicSurgeService();
