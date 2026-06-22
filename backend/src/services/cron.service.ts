import cron from 'node-cron';
import { db } from '../../db';
import { payouts } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const startCronJobs = () => {
  // Run every Friday at 17:00 (5:00 PM)
  cron.schedule('0 17 * * 5', async () => {
    console.log('Running automated payout cron job...');
    try {
      // Find all pending payouts
      const pendingPayouts = await db.select().from(payouts).where(eq(payouts.status, 'pending'));
      
      console.log(`Found ${pendingPayouts.length} pending payouts to process.`);
      
      for (const payout of pendingPayouts) {
        // Here we would integrate with Paystack/Flutterwave transfers API
        // For now, we simulate a successful transfer
        console.log(`Processing payout ${payout.id} for amount ${payout.amount}`);
        
        await db.update(payouts)
          .set({ status: 'success', resolvedAt: new Date() })
          .where(eq(payouts.id, payout.id));
      }
      
      console.log('Automated payouts completed successfully.');
    } catch (error) {
      console.error('Automated payout job failed:', error);
    }
  });

  console.log('Automated Cron Jobs initialized.');
};
