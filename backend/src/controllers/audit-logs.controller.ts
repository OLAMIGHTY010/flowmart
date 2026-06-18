import { Request, Response } from 'express';
import { db } from '../../db';
import { auditLogs, users } from '../../db/schema';
import { desc, eq, and, or, ilike, sql, gte, lte } from 'drizzle-orm';
import { Parser } from 'json2csv';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string;
    const filter = req.query.filter as string; // 'All Events', 'User Actions', 'Vendor Changes', etc.
    const dateRange = req.query.dateRange as string; // e.g. '2026-06-01,2026-06-30'

    let conditions: any[] = [];

    // Filter mapping
    if (filter && filter !== 'All Events') {
      switch(filter) {
        case 'User Actions':
          conditions.push(or(eq(auditLogs.module, 'Auth'), eq(auditLogs.module, 'Profile')));
          break;
        case 'Vendor Changes':
          conditions.push(eq(auditLogs.module, 'Vendor'));
          break;
        case 'Platform Updates':
          conditions.push(eq(auditLogs.module, 'Platform'));
          break;
        case 'System Errors':
          conditions.push(eq(auditLogs.status, 'Failed'));
          break;
        case 'Security Alerts':
          conditions.push(eq(auditLogs.module, 'Security'));
          break;
      }
    }

    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${search}%`),
          ilike(auditLogs.eventId, `%${search}%`),
          ilike(auditLogs.actorName, `%${search}%`)
        )
      );
    }

    if (dateRange) {
      const [start, end] = dateRange.split(',');
      if (start && end) {
        conditions.push(gte(auditLogs.createdAt, new Date(start)));
        conditions.push(lte(auditLogs.createdAt, new Date(end)));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);
    const total = totalResult[0].count;

    // Get paginated data
    const logs = await db.select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('getAuditLogs Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string;
    let conditions: any[] = [];

    if (filter && filter !== 'All Events') {
      switch(filter) {
        case 'User Actions':
          conditions.push(or(eq(auditLogs.module, 'Auth'), eq(auditLogs.module, 'Profile')));
          break;
        case 'Vendor Changes':
          conditions.push(eq(auditLogs.module, 'Vendor'));
          break;
        case 'System Errors':
          conditions.push(eq(auditLogs.status, 'Failed'));
          break;
        case 'Security Alerts':
          conditions.push(eq(auditLogs.module, 'Security'));
          break;
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db.select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt));

    if (!logs.length) {
      return res.status(404).json({ success: false, message: 'No logs to export' });
    }

    // Flatten metadata for CSV
    const csvData = logs.map(log => ({
      Event_ID: log.eventId,
      Timestamp: log.createdAt.toISOString(),
      Actor: log.actorName,
      Action: log.action,
      Module: log.module,
      Description: log.description,
      IP_Address: log.ipAddress || 'N/A',
      Status: log.status,
      Metadata: log.metadata ? JSON.stringify(log.metadata) : ''
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
    return res.status(200).send(csv);

  } catch (error) {
    console.error('exportAuditLogs Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
