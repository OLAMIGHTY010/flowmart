import { Request, Response } from 'express';
import { db } from '../../db';
import { welfareEvents, welfareAllocations } from '../../db/schema';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

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
    const [allocation] = await db.insert(welfareAllocations).values({
      eventId,
      zoneId,
      totalItems
    }).returning();

    return res.status(201).json({ success: true, allocation });
  } catch (error) {
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
