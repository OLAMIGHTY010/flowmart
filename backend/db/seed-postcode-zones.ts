import { db } from "./index";
import { deliveryZones, postcodeZoneMap } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Idempotent seed script for FlowMart Postcode Prefix to Delivery Zone Mappings.
 * Maps 2-segment canonical prefixes (State-LGA, e.g. LA-11, FC-02) to Delivery Pricing Zones.
 */
async function seedPostcodeZones() {
  console.log("Starting idempotent Postcode Zone Mapping seed...");

  try {
    // 1. Ensure primary zones exist in delivery_zones
    const initialZones = [
      {
        zoneName: "Default",
        baseFee: "500.00",
        perKmFee: "100.00",
        riderCommissionPct: 80,
        platformCommissionPct: 20,
      },
      {
        zoneName: "Lagos Central",
        baseFee: "800.00",
        perKmFee: "120.00",
        riderCommissionPct: 80,
        platformCommissionPct: 20,
      },
      {
        zoneName: "Abuja Central",
        baseFee: "750.00",
        perKmFee: "110.00",
        riderCommissionPct: 80,
        platformCommissionPct: 20,
      },
      {
        zoneName: "Ekiti Urban",
        baseFee: "400.00",
        perKmFee: "80.00",
        riderCommissionPct: 80,
        platformCommissionPct: 20,
      },
    ];

    const zoneNameToId = new Map<string, string>();

    for (const z of initialZones) {
      const existing = await db.query.deliveryZones.findFirst({
        where: eq(deliveryZones.zoneName, z.zoneName),
      });

      if (existing) {
        zoneNameToId.set(z.zoneName, existing.id);
        console.log(`[Zone Exists] ${z.zoneName} (${existing.id})`);
      } else {
        const [inserted] = await db
          .insert(deliveryZones)
          .values({
            zoneName: z.zoneName,
            baseFee: z.baseFee,
            perKmFee: z.perKmFee,
            riderCommissionPct: z.riderCommissionPct,
            platformCommissionPct: z.platformCommissionPct,
            active: true,
          })
          .returning();
        zoneNameToId.set(z.zoneName, inserted.id);
        console.log(`[Zone Created] ${z.zoneName} (${inserted.id})`);
      }
    }

    // 2. Canonical Prefix to Zone mappings
    // Any prefix not mapped here automatically falls back to 'Default' zone
    const mappings = [
      // Example demo rows:
      { prefix: "FC-01", zoneName: "Abuja Central", label: "Abuja Abaji" },
      { prefix: "FC-02", zoneName: "Abuja Central", label: "Abuja Municipal" },
      { prefix: "LA-11", zoneName: "Lagos Central", label: "Lagos Eti-Osa / Island" },
      { prefix: "LA-01", zoneName: "Lagos Central", label: "Lagos Agege" },
      { prefix: "EK-01", zoneName: "Ekiti Urban", label: "Ekiti Ado-Ekiti (Example Demo Row)" },
    ];

    let seededCount = 0;
    let updatedCount = 0;

    for (const m of mappings) {
      const zoneId = zoneNameToId.get(m.zoneName);
      if (!zoneId) {
        console.warn(`[Skip] Zone ${m.zoneName} not found for prefix ${m.prefix}`);
        continue;
      }

      const existingMap = await db.query.postcodeZoneMap.findFirst({
        where: eq(postcodeZoneMap.prefix, m.prefix),
      });

      if (existingMap) {
        if (existingMap.zoneId !== zoneId || !existingMap.active) {
          await db
            .update(postcodeZoneMap)
            .set({ zoneId, active: true, updatedAt: new Date() })
            .where(eq(postcodeZoneMap.id, existingMap.id));
          updatedCount++;
          console.log(`[Updated Map] ${m.prefix} -> ${m.zoneName} (${m.label})`);
        } else {
          console.log(`[Map Exists] ${m.prefix} -> ${m.zoneName}`);
        }
      } else {
        await db.insert(postcodeZoneMap).values({
          prefix: m.prefix,
          zoneId,
          active: true,
        });
        seededCount++;
        console.log(`[Created Map] ${m.prefix} -> ${m.zoneName} (${m.label})`);
      }
    }

    console.log(`\nPostcode Zone Mapping Seed Complete: ${seededCount} created, ${updatedCount} updated.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding postcode zone map:", error);
    process.exit(1);
  }
}

seedPostcodeZones();
