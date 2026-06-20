import { Request, Response } from 'express';
import { db } from '../../db';
import { deliveryZones, pricingRules } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class LogisticsPricingController {
  // --- Delivery Zones ---
  
  static async getZones(req: Request, res: Response) {
    try {
      const zones = await db.query.deliveryZones.findMany({
        orderBy: (zones, { desc }) => [desc(zones.createdAt)]
      });
      res.json({ success: true, data: zones });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createZone(req: Request, res: Response) {
    try {
      const { zoneName, baseFee, perKmFee, riderCommissionPct, platformCommissionPct, active } = req.body;
      const user = (req as any).user;
      
      // Fix: Use strings for Drizzle's decimal type fields
      let finalBaseFee = "0";
      let finalPerKmFee = "0";
      let finalRiderPct = 80;
      let finalPlatformPct = 20;

      if (user.role === 'super_admin' || user.role === 'admin') {
        finalBaseFee = baseFee !== undefined ? String(baseFee) : "0";
        finalPerKmFee = perKmFee !== undefined ? String(perKmFee) : "0";
        finalRiderPct = riderCommissionPct || 80;
        finalPlatformPct = platformCommissionPct || 20;
      }

      const [newZone] = await db.insert(deliveryZones).values({
        zoneName,
        baseFee: finalBaseFee,
        perKmFee: finalPerKmFee,
        riderCommissionPct: finalRiderPct,
        platformCommissionPct: finalPlatformPct,
        active: active !== undefined ? active : true
      }).returning();
      res.status(201).json({ success: true, data: newZone });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateZone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = (req as any).user;

      // Filter updates based on role
      const filteredUpdates: any = {};
      
      if (user.role === 'super_admin' || user.role === 'admin') {
        Object.assign(filteredUpdates, updates);
        // Fix: ensure decimals are converted to strings
        if (filteredUpdates.baseFee !== undefined) filteredUpdates.baseFee = String(filteredUpdates.baseFee);
        if (filteredUpdates.perKmFee !== undefined) filteredUpdates.perKmFee = String(filteredUpdates.perKmFee);
      } else if (user.role === 'finance') {
        // Finance can only update pricing fields (Fix: string conversion)
        if (updates.baseFee !== undefined) filteredUpdates.baseFee = String(updates.baseFee);
        if (updates.perKmFee !== undefined) filteredUpdates.perKmFee = String(updates.perKmFee);
        if (updates.riderCommissionPct !== undefined) filteredUpdates.riderCommissionPct = updates.riderCommissionPct;
        if (updates.platformCommissionPct !== undefined) filteredUpdates.platformCommissionPct = updates.platformCommissionPct;
      } else if (user.role === 'camp_logistics_coordinator' || user.role === 'zone_coordinator') {
        // Logistics can only update zone definitions
        if (updates.zoneName !== undefined) filteredUpdates.zoneName = updates.zoneName;
        if (updates.active !== undefined) filteredUpdates.active = updates.active;
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(403).json({ success: false, message: 'You do not have permission to modify these fields.' });
      }

      const [updatedZone] = await db.update(deliveryZones)
        .set({ ...filteredUpdates, updatedAt: new Date() })
        // Fix: Explicitly cast req.params.id to string
        .where(eq(deliveryZones.id, id as string)) 
        .returning();
      res.json({ success: true, data: updatedZone });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- Pricing Rules ---

  static async getRules(req: Request, res: Response) {
    try {
      const rules = await db.query.pricingRules.findMany({
        orderBy: (rules, { desc }) => [desc(rules.priority)]
      });
      res.json({ success: true, data: rules });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createRule(req: Request, res: Response) {
    try {
      const { zoneId, ruleType, condition, valueType, value, priority, active } = req.body;
      const [newRule] = await db.insert(pricingRules).values({
        zoneId: zoneId || null,
        ruleType,
        condition,
        valueType,
        // Fix: `value` is a decimal column, so it must be a string
        value: value !== undefined ? String(value) : '0', 
        priority: priority || 0,
        active: active !== undefined ? active : true
      }).returning();
      res.status(201).json({ success: true, data: newRule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Fix: Catch any stray value update and cast to string
      if (updates.value !== undefined) {
         updates.value = String(updates.value);
      }

      const [updatedRule] = await db.update(pricingRules)
        .set({ ...updates, updatedAt: new Date() })
        // Fix: Explicitly cast req.params.id to string
        .where(eq(pricingRules.id, id as string)) 
        .returning();
      res.json({ success: true, data: updatedRule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
