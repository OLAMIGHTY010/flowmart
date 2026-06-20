import { db } from './index';
import { auditLogs, users } from './schema';
import crypto from 'crypto';

const generateEventId = () => `EVT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

async function seedAuditLogs() {
  console.log('Seeding dummy audit logs...');
  try {
    // We need at least one user to attach the logs to, or we can use null for system logs.
    const systemLogs = [
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'System',
        action: 'Created',
        module: 'Platform',
        description: 'System initialized successfully after database reset.',
        ipAddress: '127.0.0.1',
        status: 'Success',
        metadata: { info: "Database reset triggered" }
      },
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'System',
        action: 'Updated',
        module: 'Security',
        description: 'Updated system-wide encryption keys.',
        ipAddress: '127.0.0.1',
        status: 'Success',
        metadata: { key_rotation: true }
      },
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'System',
        action: 'Alert',
        module: 'Platform',
        description: 'Failed to synchronize with third-party payment gateway.',
        ipAddress: '127.0.0.1',
        status: 'Failed',
        metadata: { error: "Timeout from Paystack API" }
      }
    ];

    // Some mocked user/vendor logs
    const mockedUserLogs = [
      {
        eventId: generateEventId(),
        actorId: null, // Will map to dummy ID or leave null but give a name
        actorName: 'Vendor: John Doe',
        action: 'Created',
        module: 'Vendor',
        description: 'New vendor submitted KYC documentation for review.',
        ipAddress: '192.168.1.45',
        status: 'Success',
        metadata: { documents_count: 3 }
      },
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'Admin: Adeyemi Olusola',
        action: 'Approved',
        module: 'Vendor',
        description: 'Approved vendor KYC for John Doe.',
        ipAddress: '10.0.0.5',
        status: 'Success',
        metadata: { vendor_id: "mock-1234" }
      },
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'System',
        action: 'Created',
        module: 'Auth',
        description: 'Super Admin Adeyemi Olusola logged into the system.',
        ipAddress: '10.0.0.5',
        status: 'Success',
        metadata: { role: "super_admin" }
      },
      {
        eventId: generateEventId(),
        actorId: null,
        actorName: 'Unknown IP',
        action: 'Rejected',
        module: 'Security',
        description: 'Failed login attempt detected from unrecognized location.',
        ipAddress: '172.16.254.1',
        status: 'Failed',
        metadata: { attempt_count: 5 }
      }
    ];

    const allLogs = [...systemLogs, ...mockedUserLogs];

    // We can randomize the created_at dates to make the dashboard look active over time
    for (const log of allLogs) {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - Math.floor(Math.random() * 48)); // Random time within last 48 hours
      
      await db.insert(auditLogs).values({
        ...log,
        createdAt: pastDate,
      });
    }

    console.log('✅ 7 Dummy Audit Logs seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding audit logs:', err);
    process.exit(1);
  }
}

seedAuditLogs();
