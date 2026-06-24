import { Request, Response } from 'express';
import { db } from '../../db';
import { auditLogs, users } from '../../db/schema';
import { desc, eq, and, or, ilike, sql, gte, lte } from 'drizzle-orm';
import { Parser } from 'json2csv';

const buildDynamicLogsQuery = (search: string, filter: string, dateRange: string) => {
  const query = sql`
    WITH dynamic_logs AS (
      SELECT id::text as id, event_id, actor_id::text as actor_id, actor_name, action, module, description, ip_address, status, metadata, created_at FROM audit_logs
      UNION ALL
      SELECT id::text, 'AUT-' || substring(id::text from 1 for 4), id::text, full_name, 'Registered'::text, 'Auth'::text, 'New user registered: ' || full_name, 'N/A'::text, 'Success'::text, '{}'::jsonb, created_at FROM users
      UNION ALL
      SELECT id::text, 'ORD-' || order_ref, attendee_id::text, 'System'::text, status::text, 'Delivery'::text, 'Order ' || order_ref || ' status changed to ' || status::text, 'N/A'::text, 'Success'::text, '{}'::jsonb, updated_at FROM orders
      UNION ALL
      SELECT id::text, 'VEN-' || substring(id::text from 1 for 4), vendor_id::text, business_name, status::text, 'Vendor'::text, 'Vendor KYC status: ' || status::text, 'N/A'::text, 'Success'::text, '{}'::jsonb, updated_at FROM vendor_kyc
      UNION ALL
      SELECT id::text, 'RID-' || substring(id::text from 1 for 4), rider_id::text, 'System'::text, status::text, 'Rider'::text, 'Rider KYC status: ' || status::text, 'N/A'::text, 'Success'::text, '{}'::jsonb, updated_at FROM rider_kyc
      UNION ALL
      SELECT id::text, 'WEL-' || substring(id::text from 1 for 4), created_by::text, 'System'::text, status::text, 'Welfare'::text, 'Welfare event ' || name || ' created', 'N/A'::text, 'Success'::text, '{}'::jsonb, created_at FROM welfare_events
    )
    SELECT * FROM dynamic_logs WHERE 1=1
  `;

  if (filter && filter !== 'All Events') {
    switch(filter) {
      case 'User Actions':
        query.append(sql` AND (module = 'Auth' OR module = 'Profile')`);
        break;
      case 'Vendor Changes':
        query.append(sql` AND module = 'Vendor'`);
        break;
      case 'Platform Updates':
        query.append(sql` AND module = 'Platform'`);
        break;
      case 'System Errors':
        query.append(sql` AND status = 'Failed'`);
        break;
      case 'Security Alerts':
        query.append(sql` AND module = 'Security'`);
        break;
    }
  }

  if (search) {
    const searchParam = `%${search}%`;
    query.append(sql` AND (description ILIKE ${searchParam} OR event_id ILIKE ${searchParam} OR actor_name ILIKE ${searchParam})`);
  }

  if (dateRange) {
    const [start, end] = dateRange.split(',');
    if (start && end) {
      query.append(sql` AND created_at >= ${new Date(start)} AND created_at <= ${new Date(end)}`);
    }
  }

  return query;
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string || '';
    const filter = req.query.filter as string || '';
    const dateRange = req.query.dateRange as string || '';

    const baseQuery = buildDynamicLogsQuery(search, filter, dateRange);

    const countQuery = sql`SELECT count(*) FROM (${baseQuery}) as count_logs`;
    const totalResult = await db.execute(countQuery);
    const total = parseInt(totalResult.rows[0].count as string);

    const logsQuery = sql`${baseQuery} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
    const logsResult = await db.execute(logsQuery);

    const logs = logsResult.rows.map((row: any) => ({
      id: row.id,
      eventId: row.event_id,
      actorId: row.actor_id,
      actorName: row.actor_name,
      action: row.action,
      module: row.module,
      description: row.description,
      ipAddress: row.ip_address,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

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
    const filter = req.query.filter as string || '';
    
    const baseQuery = buildDynamicLogsQuery('', filter, '');
    const logsQuery = sql`${baseQuery} ORDER BY created_at DESC`;
    const logsResult = await db.execute(logsQuery);

    if (!logsResult.rows.length) {
      return res.status(404).json({ success: false, message: 'No logs to export' });
    }

    // Flatten metadata for CSV
    const csvData = logsResult.rows.map((row: any) => ({
      Event_ID: row.event_id,
      Timestamp: new Date(row.created_at).toISOString(),
      Actor: row.actor_name,
      Action: row.action,
      Module: row.module,
      Description: row.description,
      IP_Address: row.ip_address || 'N/A',
      Status: row.status,
      Metadata: row.metadata ? JSON.stringify(row.metadata) : ''
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
