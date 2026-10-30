import { db } from '../../db';
import { globalSettings, deliveryZones, pricingRules, orderDelivery, postcodeZoneMap } from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { extractPostcodePrefix } from '../utils/postcode.util';
import { dynamicSurgeService } from './logistics/dynamic-surge.service';

export class PricingService {
  /**
   * Calculates delivery fees and splits.
   * Resolves the pricing zone from the postcode prefix (via postcode_zone_map)
   * or direct zone name match, falling back to 'Default' zone.
   *
   * @param zoneOrPostcode Either a full postcode, a 2-segment prefix (e.g. 'LA-11'), or a legacy zone name.
   * @param distanceKm Estimated delivery distance in KM.
   */
  static async calculateDeliveryFee(zoneOrPostcode: string, distanceKm: number = 5) {
    let zoneRecord: any = null;

    // 1. Attempt resolution via Postcode Prefix mapping
    if (zoneOrPostcode) {
      const prefix = extractPostcodePrefix(zoneOrPostcode);
      if (prefix) {
        try {
          const mapping = await db.query.postcodeZoneMap.findFirst({
            where: and(eq(postcodeZoneMap.prefix, prefix), eq(postcodeZoneMap.active, true)),
          });

          if (mapping && mapping.zoneId) {
            zoneRecord = await db.query.deliveryZones.findFirst({
              where: and(eq(deliveryZones.id, mapping.zoneId), eq(deliveryZones.active, true)),
            });
          }
        } catch (err) {
          console.warn(`[PricingService] Failed to resolve prefix ${prefix} from postcode_zone_map:`, err);
        }
      }
    }

    // 2. Fallback to direct zoneName match (for legacy requests e.g. 'Default', 'Lagos Central')
    if (!zoneRecord && zoneOrPostcode) {
      // Truncate to 100 characters to safely prevent database column length violations on legacy free-text addresses
      const safeZoneName = zoneOrPostcode.trim().substring(0, 100);
      try {
        zoneRecord = await db.query.deliveryZones.findFirst({
          where: eq(deliveryZones.zoneName, safeZoneName),
        });
      } catch (err) {
        console.warn(`[PricingService] Direct zoneName lookup failed for "${safeZoneName}":`, err);
      }
    }

    // 3. Fallback to 'Default' zone
    if (!zoneRecord) {
      zoneRecord = await db.query.deliveryZones.findFirst({
        where: eq(deliveryZones.zoneName, 'Default'),
      });
      
      if (!zoneRecord) {
        // Create 'Default' zone dynamically if missing
        const [newZone] = await db.insert(deliveryZones).values({
          zoneName: 'Default',
          baseFee: "500", // e.g., 500 NGN
          perKmFee: "100", // e.g., 100 NGN per Km
          riderCommissionPct: 70,
          platformCommissionPct: 30,
        }).returning();
        zoneRecord = newZone;
      }
    }

    const baseFee = parseFloat(zoneRecord.baseFee.toString());
    const perKmFee = parseFloat(zoneRecord.perKmFee.toString());
    const distanceFee = distanceKm * perKmFee;
    let subtotal = baseFee + distanceFee;

    // 4. Fetch Active Rules for this zone (or global)
    let rules: any[] = [];
    try {
      rules = await db.query.pricingRules.findMany({
        where: and(
          eq(pricingRules.active, true),
        ),
        orderBy: [asc(pricingRules.priority)],
      });
    } catch (err) {
      console.warn("[PricingService] Failed to fetch pricingRules:", err);
    }

    const appliedAdjustments: any[] = [];
    let currentTotal = subtotal;

    for (const rule of rules) {
      if (rule.zoneId && rule.zoneId !== zoneRecord.id) {
        continue;
      }
      
      let applies = false;
      const condition = rule.condition as any;
      const ruleValue = parseFloat(rule.value.toString());

      if (rule.ruleType === 'night_surcharge') {
        const hour = new Date().getHours();
        if (hour >= 21 || hour < 6) applies = true;
      } else if (rule.ruleType === 'distance_multiplier') {
        if (distanceKm > (condition?.minDistance || 0)) applies = true;
      } else if (rule.ruleType === 'surge_pricing') {
        applies = true;
      } else {
        applies = true;
      }

      if (applies) {
        let adjustmentValue = 0;
        if (rule.valueType === 'fixed') {
          adjustmentValue = ruleValue;
        } else if (rule.valueType === 'percentage') {
          adjustmentValue = currentTotal * (ruleValue / 100);
        } else if (rule.valueType === 'multiplier') {
          adjustmentValue = (currentTotal * ruleValue) - currentTotal;
        }

        currentTotal += adjustmentValue;
        appliedAdjustments.push({
          ruleId: rule.id,
          ruleType: rule.ruleType,
          effect: adjustmentValue,
        });
      }
    }

    const subtotalBeforeSurge = currentTotal;

    // 5. Dynamic Zone Surge & Weather Engine (Chowdeck-Grade)
    const surgeData = dynamicSurgeService.resolveSurgeForOrder(zoneRecord.zoneName, subtotalBeforeSurge);
    const finalDeliveryFee = surgeData.finalDeliveryFeeNgn;
    const riderShare = surgeData.riderPayoutNgn;
    const platformShare = surgeData.platformCommissionNgn;

    return {
      resolvedZone: zoneRecord.zoneName, // The clean zone name (e.g. 'Lagos Central', 'Default')
      zoneId: zoneRecord.id,
      distanceKm,
      baseFee,
      distanceFee,
      ruleAdjustments: appliedAdjustments,
      // Chowdeck-Grade Dynamic Surge & Weather Breakdown
      isSurgeActive: surgeData.isSurgeActive,
      surgeMultiplier: surgeData.surgeMultiplier,
      surgeFee: surgeData.surgeSurchargeNgn,
      weatherFee: surgeData.weatherFeeNgn,
      weatherCondition: surgeData.weatherCondition,
      surgeReason: surgeData.surgeReason,
      riderShare,
      platformShare,
      finalDeliveryFee,
    };
  }

  /**
   * Persist the calculation to order_delivery
   */
  static async saveOrderDelivery(orderId: string, calculation: any) {
    const [record] = await db.insert(orderDelivery).values({
      orderId,
      distanceKm: calculation.distanceKm.toString(),
      baseFee: calculation.baseFee.toString(),
      distanceFee: calculation.distanceFee.toString(),
      ruleAdjustments: calculation.ruleAdjustments,
      riderShare: calculation.riderShare.toString(),
      platformShare: calculation.platformShare.toString(),
      finalDeliveryFee: calculation.finalDeliveryFee.toString(),
    }).returning();

    return record;
  }
}
