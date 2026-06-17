import { db } from '../../db';
import { users } from '../../db/schema';
import { lte, ne, and } from 'drizzle-orm';

/**
 * Account Cleanup Script
 * 
 * Rules:
 * - Any account after 90 days of no activity should be suspended.
 * - Any account after 120 days of no activity should be deleted.
 * - Exception: Super Admins can never be suspended or deleted.
 * 
 * This can be run via a cron job (e.g. node-cron or system crontab).
 */
export async function runAccountCleanup() {
  try {
    console.log('[Account Cleanup] Starting cleanup process...');
    
    const now = new Date();
    
    // 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);
    
    // 120 days ago
    const oneHundredTwentyDaysAgo = new Date();
    oneHundredTwentyDaysAgo.setDate(now.getDate() - 120);

    // 1. Delete users inactive for > 120 days (except super_admin)
    const deleteResult = await db.delete(users)
      .where(
        and(
          lte(users.lastLogin, oneHundredTwentyDaysAgo),
          ne(users.role, 'super_admin')
        )
      )
      .returning({ id: users.id, email: users.email });
      
    console.log(`[Account Cleanup] Deleted ${deleteResult.length} accounts inactive for > 120 days.`);

    // 2. Suspend users inactive for > 90 days (except super_admin)
    // Note: If they are already deleted by the step above, they won't be caught here.
    const suspendResult = await db.update(users)
      .set({ status: 'suspended' })
      .where(
        and(
          lte(users.lastLogin, ninetyDaysAgo),
          ne(users.role, 'super_admin'),
          ne(users.status, 'suspended') // Don't re-suspend if already suspended
        )
      )
      .returning({ id: users.id, email: users.email });
      
    console.log(`[Account Cleanup] Suspended ${suspendResult.length} accounts inactive for > 90 days.`);

    console.log('[Account Cleanup] Cleanup process complete.');
    
  } catch (error) {
    console.error('[Account Cleanup] Error during cleanup:', error);
  }
}

// If run directly via CLI
if (require.main === module) {
  runAccountCleanup().then(() => process.exit(0)).catch(() => process.exit(1));
}
