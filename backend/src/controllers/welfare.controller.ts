import { Request, Response } from 'express';
import { db } from '../../db';
import { welfareEvents, welfareAllocations, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emailService } from '../services/email.service';

const generateWelfareRef = () => {
	const randomSeq = Math.floor(1000 + Math.random() * 9000).toString();
	return `DF${randomSeq}`;
};

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
    const deliveryRef = generateWelfareRef();
    
    const [allocation] = await db.insert(welfareAllocations).values({
      eventId,
      zoneId,
      totalItems,
      deliveryRef
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

export const bulkAllocateWelfare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventId, allocations } = req.body;

    if (!eventId || !Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const valuesToInsert = allocations.map((alloc: { zoneId: string, totalItems: number }) => ({
      eventId,
      zoneId: alloc.zoneId,
      totalItems: alloc.totalItems,
      deliveryRef: generateWelfareRef()
    }));

    const insertedAllocations = await db.insert(welfareAllocations).values(valuesToInsert).returning();
    const [event] = await db.select().from(welfareEvents).where(eq(welfareEvents.id, eventId)).limit(1);
    const [coordinator] = await db.select().from(users).where(eq(users.role, 'zone_coordinator')).limit(1);

    if (coordinator && event) {
      const totalBulkItems = valuesToInsert.reduce((sum, a) => sum + a.totalItems, 0);
      emailService.sendWelfareAllocationAlert(coordinator.email, {
        coordinatorName: coordinator.fullName,
        zoneId: `Multiple Zones (${insertedAllocations.length} total)`,
        eventName: event.name,
        totalItems: totalBulkItems
      }).catch(console.error);
    }

    return res.status(201).json({ success: true, count: insertedAllocations.length, allocations: insertedAllocations });
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

export const reportShortage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityMissing, shortageDescription } = req.body;

    if (!quantityMissing || !shortageDescription) {
      return res.status(400).json({ success: false, message: 'Missing shortage details' });
    }

    const [updatedAllocation] = await db.update(welfareAllocations).set({
      shortageReported: quantityMissing,
      shortageDescription: shortageDescription,
      shortageReportedAt: new Date(),
      status: 'shortage',
      updatedAt: new Date()
    }).where(eq(welfareAllocations.id, id)).returning();

    if (!updatedAllocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    return res.status(200).json({ success: true, allocation: updatedAllocation });
  } catch (error) {
    console.error('Report Shortage Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateWelfareStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const riderId = req.user?.role === 'dispatch_rider' ? req.user.id : undefined;

    let updatePayload: any = { status, updatedAt: new Date() };

    if (status === 'assigned' && riderId) {
      updatePayload.riderId = riderId;
    }

    const [updatedAllocation] = await db.update(welfareAllocations)
      .set(updatePayload)
      .where(eq(welfareAllocations.id, id))
      .returning();

    return res.status(200).json({ success: true, allocation: updatedAllocation });
  } catch (error) {
    console.error('Update Welfare Status Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
