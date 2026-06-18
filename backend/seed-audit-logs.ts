import { db } from './db';
import { auditLogs, users } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function seedAuditLogs() {
  console.log('Seeding audit logs...');

  // Get a user to act as the actor
  const allUsers = await db.select().from(users).limit(5);
  const actor1 = allUsers[0];
  const actor2 = allUsers[1];

  if (!actor1) {
    console.error('No users found. Please seed users first.');
    return;
  }

  const logs = [
    {
      eventId: 'AUT-3047',
      actorId: actor1.id,
      actorName: actor1.fullName,
      action: 'Rejected',
      module: 'Onboard',
      description: 'Rejected vendor registration... For HubTech.',
      ipAddress: '197.255.4.39',
      status: 'Success',
      metadata: { reason: "Missing CAC certificate" },
      createdAt: new Date('2026-06-15T10:30:00Z'),
    },
    {
      eventId: 'AUT-3048',
      actorId: actor1.id,
      actorName: actor1.fullName,
      action: 'Updated',
      module: 'Profile',
      description: 'Updated profile information for Frank Emmanuel.',
      ipAddress: '197.255.4.39',
      status: 'Success',
      metadata: { previous: { phone: "08012345678" }, new: { phone: "08123456789" } },
      createdAt: new Date('2026-06-15T11:15:00Z'),
    },
    {
      eventId: 'AUT-3049',
      actorId: actor2 ? actor2.id : actor1.id,
      actorName: actor2 ? actor2.fullName : actor1.fullName,
      action: 'Login',
      module: 'Auth',
      description: 'Successful login event.',
      ipAddress: '41.82.110.3',
      status: 'Success',
      metadata: { browser: "Chrome", OS: "Windows" },
      createdAt: new Date('2026-06-16T08:00:00Z'),
    },
    {
      eventId: 'AUT-3050',
      actorId: null,
      actorName: 'System',
      action: 'Failed',
      module: 'Auth',
      description: 'Failed login attempt - Invalid password.',
      ipAddress: '147.43.20.14',
      status: 'Failed',
      metadata: { email_attempted: "admin@flowmart.ng" },
      createdAt: new Date('2026-06-16T09:45:00Z'),
    },
    {
      eventId: 'AUT-3051',
      actorId: actor1.id,
      actorName: actor1.fullName,
      action: 'Created',
      module: 'Vendor',
      description: 'Created new vendor account - Faster Food Services.',
      ipAddress: '197.255.4.39',
      status: 'Success',
      metadata: null,
      createdAt: new Date('2026-06-16T14:20:00Z'),
    },
    {
      eventId: 'AUT-3052',
      actorId: null,
      actorName: 'System',
      action: 'Alert',
      module: 'Security',
      description: 'Multiple failed login attempts detected.',
      ipAddress: '147.43.20.14',
      status: 'Failed',
      metadata: { threshold: 5, time_window: "10m" },
      createdAt: new Date('2026-06-16T16:00:00Z'),
    },
  ];

  await db.insert(auditLogs).values(logs);

  console.log('Successfully seeded audit logs!');
  process.exit(0);
}

seedAuditLogs().catch(console.error);
