import { Request, Response } from 'express';
import { db } from '../../db';
import { welfareEvents, welfareAllocations, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emailService } from '../services/email.service';

export const createWelfareEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, date } = req.body;
    const [event] = await db.insert(welfareEvents).values({
      name,
      date: new Date(date),
      createdBy: req.user!.id
    }).returning();
    
    return res.status(201).json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const allocateWelfare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId, zoneId, totalItems } = req.body;
    
    // 1. Create the single allocation
    const [allocation] = await db.insert(welfareAllocations).values({
      eventId,
      zoneId,
      totalItems
    }).returning();

    const [event] = await db.select().from(welfareEvents).where(eq(welfareEvents.id, eventId)).limit(1);
    const [coordinator] = await db.select().from(users).where(eq(users.role, 'zone_coordinator')).limit(1);

    if (coordinator && event) {
      emailService.sendWelfareAllocationAlert(coordinator.email, {
        coordinatorName: coordinator.fullName,
        zoneId: allocation.zoneId,
        eventName: event.name,
        totalItems: allocation.totalItems
      }).catch(console.error);
    }

    return res.status(201).json({ success: true, allocation });
  } catch (error) {
    console.error('Welfare Allocation Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ✨ NEW: Bulk Allocation via CSV data
export const bulkAllocateWelfare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId, allocations } = req.body;

    // Validate payload
    if (!eventId || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payload: eventId and an array of allocations are required.' 
      });
    }

    // Map the incoming array to match the Drizzle schema
    const valuesToInsert = allocations.map((alloc: { zoneId: string, totalItems: number }) => ({
      eventId,
      zoneId: alloc.zoneId,
      totalItems: alloc.totalItems
    }));

    // Perform the bulk insert in a single database query
    const insertedAllocations = await db.insert(welfareAllocations).values(valuesToInsert).returning();

    // Fetch details for the summary email
    const [event] = await db.select().from(welfareEvents).where(eq(welfareEvents.id, eventId)).limit(1);
    const [coordinator] = await db.select().from(users).where(eq(users.role, 'zone_coordinator')).limit(1);

    // Send a single summary email rather than one per zone
    if (coordinator && event) {
      const totalBulkItems = valuesToInsert.reduce((sum, a) => sum + a.totalItems, 0);
      
      emailService.sendWelfareAllocationAlert(coordinator.email, {
        coordinatorName: coordinator.fullName,
        zoneId: `Multiple Zones (${insertedAllocations.length} total)`,
        eventName: event.name,
        totalItems: totalBulkItems
      }).catch(console.error);
    }

    return res.status(201).json({ 
      success: true, 
      message: `Successfully processed ${insertedAllocations.length} allocations.`,
      count: insertedAllocations.length,
      allocations: insertedAllocations
    });

  } catch (error) {
    console.error('Bulk Welfare Allocation Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getWelfareReports = async (req: Request, res: Response) => {
  try {
    const reports = await db.select().from(welfareAllocations);
    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
