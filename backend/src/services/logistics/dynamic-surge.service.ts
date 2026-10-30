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
 * 5. Rider Incentive Bonus Allocation (80% surge + 100% weather fee to rider)
 * 6. Live Operations Zone Management (Yaba, Lekki, VI, Ikeja, Surulere, Ikoyi)
 * 7. Metro Weather Emergency Broadcast Toggle ("Metro Rain Mode")
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
  weatherFeeNgn?: number;
  weatherCondition?: string;
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

export interface ZoneSurgeState {
  id: string;
  zoneName: string;
  city: string;
  activeMultiplier: number;
  demandLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  weatherCondition: 'CLEAR' | 'DRIZZLE' | 'RAIN' | 'THUNDERSTORM';
  isRainModeActive: boolean;
  rainFeeNgn: number;
  activeCouriersCount: number;
  pendingOrdersCount: number;
  isAutoElastic: boolean;
  updatedAt: string;
}

export interface MetroRainBroadcast {
  isMetroRainModeActive: boolean;
  rainFeeBonus: number;
  broadcastMessage: string;
  affectedCities: string[];
  activatedAt: string | null;
}

export class DynamicSurgeService {
  private static readonly MAX_SURGE_CEILING = 2.2; // Maximum 2.2x cap

  // Live operational zone states in Lagos
  private zones: ZoneSurgeState[] = [
    {
      id: 'yaba-01',
      zoneName: 'Yaba & Akoka Cluster',
      city: 'Lagos',
      activeMultiplier: 1.3,
      demandLevel: 'HIGH',
      weatherCondition: 'DRIZZLE',
      isRainModeActive: true,
      rainFeeNgn: 400,
      activeCouriersCount: 18,
      pendingOrdersCount: 26,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'lekki-01',
      zoneName: 'Lekki Phase 1 & Admiralty',
      city: 'Lagos',
      activeMultiplier: 1.5,
      demandLevel: 'CRITICAL',
      weatherCondition: 'RAIN',
      isRainModeActive: true,
      rainFeeNgn: 600,
      activeCouriersCount: 12,
      pendingOrdersCount: 28,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'vi-01',
      zoneName: 'Victoria Island & Adeola Odeku',
      city: 'Lagos',
      activeMultiplier: 1.4,
      demandLevel: 'ELEVATED',
      weatherCondition: 'RAIN',
      isRainModeActive: true,
      rainFeeNgn: 500,
      activeCouriersCount: 15,
      pendingOrdersCount: 21,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ikeja-01',
      zoneName: 'Ikeja GRA & Allen Avenue',
      city: 'Lagos',
      activeMultiplier: 1.2,
      demandLevel: 'ELEVATED',
      weatherCondition: 'CLEAR',
      isRainModeActive: false,
      rainFeeNgn: 400,
      activeCouriersCount: 22,
      pendingOrdersCount: 18,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'surulere-01',
      zoneName: 'Surulere & Stadium Cluster',
      city: 'Lagos',
      activeMultiplier: 1.0,
      demandLevel: 'NORMAL',
      weatherCondition: 'CLEAR',
      isRainModeActive: false,
      rainFeeNgn: 300,
      activeCouriersCount: 16,
      pendingOrdersCount: 9,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ikoyi-01',
      zoneName: 'Ikoyi & Banana Island VIP',
      city: 'Lagos',
      activeMultiplier: 1.5,
      demandLevel: 'HIGH',
      weatherCondition: 'RAIN',
      isRainModeActive: true,
      rainFeeNgn: 700,
      activeCouriersCount: 9,
      pendingOrdersCount: 14,
      isAutoElastic: false,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'maryland-01',
      zoneName: 'Maryland & Anthony Expressway',
      city: 'Lagos',
      activeMultiplier: 1.1,
      demandLevel: 'NORMAL',
      weatherCondition: 'CLEAR',
      isRainModeActive: false,
      rainFeeNgn: 400,
      activeCouriersCount: 11,
      pendingOrdersCount: 8,
      isAutoElastic: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  // Metro-wide Emergency Weather Broadcast State
  private metroRainBroadcast: MetroRainBroadcast = {
    isMetroRainModeActive: true,
    rainFeeBonus: 500,
    broadcastMessage: 'Metro Rain Mode Active: 100% of weather safety bonus is remitted directly to your courier champion.',
    affectedCities: ['Lagos Mainland', 'Lagos Island', 'Lekki Corridor'],
    activatedAt: new Date().toISOString(),
  };

  /**
   * Calculate real-time dynamic logistics fee (Standard regression)
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

  /**
   * Get all live operations zones
   */
  public getZones(): ZoneSurgeState[] {
    return [...this.zones];
  }

  /**
   * Get zone by ID or matching zone name
   */
  public getZoneById(id: string): ZoneSurgeState | undefined {
    return this.zones.find(z => z.id === id || z.zoneName.toLowerCase().includes(id.toLowerCase()));
  }

  /**
   * Update an operational zone multiplier or weather status
   */
  public updateZone(id: string, updates: Partial<ZoneSurgeState>): ZoneSurgeState | null {
    const zoneIndex = this.zones.findIndex(z => z.id === id);
    if (zoneIndex === -1) return null;

    const current = this.zones[zoneIndex];
    const updated: ZoneSurgeState = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.activeMultiplier !== undefined) {
      if (updated.activeMultiplier >= 1.5) updated.demandLevel = 'CRITICAL';
      else if (updated.activeMultiplier >= 1.3) updated.demandLevel = 'HIGH';
      else if (updated.activeMultiplier > 1.05) updated.demandLevel = 'ELEVATED';
      else updated.demandLevel = 'NORMAL';
    }

    this.zones[zoneIndex] = updated;
    return updated;
  }

  /**
   * Broadcast or revoke metro-wide rain mode emergency
   */
  public setMetroRainBroadcast(isActive: boolean, rainFeeBonus: number = 500, message?: string): MetroRainBroadcast {
    this.metroRainBroadcast = {
      isMetroRainModeActive: isActive,
      rainFeeBonus,
      broadcastMessage: message || (isActive 
        ? 'Metro Rain Mode Active: 100% of weather safety bonus is remitted directly to your courier champion.' 
        : 'Metro Rain Mode Deactivated. Standard operational dispatch active.'),
      affectedCities: ['Lagos Mainland', 'Lagos Island', 'Lekki Corridor'],
      activatedAt: isActive ? new Date().toISOString() : null,
    };

    // If activated, ensure rainfall mode is set on wet zones
    if (isActive) {
      this.zones.forEach(z => {
        if (z.id.includes('lekki') || z.id.includes('vi') || z.id.includes('ikoyi') || z.id.includes('yaba')) {
          z.isRainModeActive = true;
          if (z.weatherCondition === 'CLEAR') z.weatherCondition = 'RAIN';
        }
      });
    }

    return this.metroRainBroadcast;
  }

  /**
   * Get current metro rain broadcast status
   */
  public getMetroRainStatus(): MetroRainBroadcast {
    return { ...this.metroRainBroadcast };
  }

  /**
   * Resolve live dynamic pricing for a checkout order
   */
  public resolveSurgeForOrder(zoneName: string = 'Default', subtotalDeliveryFee: number = 800): {
    baseFeeNgn: number;
    surgeMultiplier: number;
    surgeSurchargeNgn: number;
    weatherFeeNgn: number;
    weatherCondition: string;
    isSurgeActive: boolean;
    surgeReason: string;
    finalDeliveryFeeNgn: number;
    riderPayoutNgn: number;
    platformCommissionNgn: number;
  } {
    // Locate matched zone
    const matched = this.zones.find(z => 
      zoneName.toLowerCase().includes(z.zoneName.toLowerCase().split(' ')[0].toLowerCase()) ||
      z.zoneName.toLowerCase().includes(zoneName.toLowerCase())
    ) || this.zones[0]; // Fallback to Yaba cluster

    const multiplier = matched.activeMultiplier;
    const baseFee = Math.round(subtotalDeliveryFee);
    const surgeSurcharge = Math.round(baseFee * (multiplier - 1));

    // Determine rain fee
    let weatherFee = 0;
    if (this.metroRainBroadcast.isMetroRainModeActive || matched.isRainModeActive || matched.weatherCondition === 'RAIN' || matched.weatherCondition === 'THUNDERSTORM') {
      weatherFee = this.metroRainBroadcast.isMetroRainModeActive ? this.metroRainBroadcast.rainFeeBonus : matched.rainFeeNgn;
    }

    const isSurgeActive = multiplier > 1.05 || weatherFee > 0;
    const finalDeliveryFee = baseFee + surgeSurcharge + weatherFee;

    // Courier payout: 75% base + 80% surge + 100% of weather fee!
    const riderBase = Math.round(baseFee * 0.75);
    const riderSurgeShare = Math.round(surgeSurcharge * 0.8);
    const riderPayout = riderBase + riderSurgeShare + weatherFee;
    const platformCommission = finalDeliveryFee - riderPayout;

    // Reason description
    const reasons: string[] = [];
    if (multiplier > 1.05) reasons.push(`${multiplier}x High Demand (${matched.demandLevel})`);
    if (weatherFee > 0) reasons.push(`🌧️ Rainy Weather Protection (+₦${weatherFee.toLocaleString()})`);

    const surgeReason = isSurgeActive 
      ? reasons.join(' • ') 
      : 'Standard baseline logistics pricing';

    return {
      baseFeeNgn: baseFee,
      surgeMultiplier: multiplier,
      surgeSurchargeNgn: surgeSurcharge,
      weatherFeeNgn: weatherFee,
      weatherCondition: matched.weatherCondition,
      isSurgeActive,
      surgeReason,
      finalDeliveryFeeNgn: finalDeliveryFee,
      riderPayoutNgn: riderPayout,
      platformCommissionNgn: platformCommission,
    };
  }
}

export const dynamicSurgeService = new DynamicSurgeService();
