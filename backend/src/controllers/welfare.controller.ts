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
    
    // 1. Create the allocation
    const [allocation] = await db.insert(welfareAllocations).values({
      eventId,
      zoneId,
      totalItems
    }).returning();

    // 2. Fetch the Event Name for the email
    const [event] = await db.select().from(welfareEvents).where(eq(welfareEvents.id, eventId)).limit(1);

    // 3. Find a Zone Coordinator to notify
    const [coordinator] = await db.select().from(users).where(eq(users.role, 'zone_coordinator')).limit(1);

    // 4. Send the Allocation Email
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

export const getWelfareReports = async (req: Request, res: Response) => {
  try {
    const reports = await db.select().from(welfareAllocations);
    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};