import { db } from '../../db';
import { globalSettings, deliveryZones, pricingRules, orderDelivery } from '../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export class PricingService {
  /**
   * Calculates delivery fees and splits
   */
  static async calculateDeliveryFee(zoneName: string, distanceKm: number) {
    // 1. Fetch zone
    let zoneRecord = await db.query.deliveryZones.findFirst({
      where: eq(deliveryZones.zoneName, zoneName),
    });

    if (!zoneRecord) {
      throw new Error(`Delivery zone '${zoneName}' is not configured. Please contact logistics.`);
    }

    const baseFee = parseFloat(zoneRecord.baseFee.toString());
    const perKmFee = parseFloat(zoneRecord.perKmFee.toString());
    const distanceFee = distanceKm * perKmFee;
    let subtotal = baseFee + distanceFee;

    // 2. Fetch Active Rules for this zone (or global)
    const rules = await db.query.pricingRules.findMany({
      where: and(
        eq(pricingRules.active, true),
      ),
      orderBy: [asc(pricingRules.priority)],
    });

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
        // Logistics-configured surge pricing
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

    const finalDeliveryFee = currentTotal;

    // 3. Calculate splits
    const riderSharePct = zoneRecord.riderCommissionPct;
    const platformSharePct = zoneRecord.platformCommissionPct;

    const riderShare = finalDeliveryFee * (riderSharePct / 100);
    const platformShare = finalDeliveryFee * (platformSharePct / 100);

    return {
      distanceKm,
      baseFee,
      distanceFee,
      ruleAdjustments: appliedAdjustments,
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
