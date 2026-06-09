import { Response } from 'express';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendInAppNotification } from '../services/websocket';

export const processSyncQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { actions } = req.body; 
    const results = [];

    for (const action of actions) {
      if (action.type === 'confirm_delivery') {
        const { orderId, pin } = action.payload;
        
        const [activeOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        
        if (activeOrder && activeOrder.deliveryPin === pin) {
          await db.update(orders).set({ status: 'delivered', updatedAt: new Date() }).where(eq(orders.id, orderId));
          results.push({ orderId, status: 'success' });
          
          sendInAppNotification(activeOrder.attendeeId, 'order.delivered', { orderId });
        } else {
          results.push({ orderId, status: 'failed', reason: 'Invalid PIN' });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Queues flushed', results });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sync processing failed' });
  }
};
