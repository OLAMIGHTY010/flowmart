import { Request, Response } from 'express';
import { db } from '../../db'; 
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { creditPendingBalance } from '../services/ledger.service';
import { sendInAppNotification } from '../services/websocket';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyTransaction as verifyPaystack } from '../services/paystack.service';
import { verifyTransaction as verifyFlutterwave } from '../services/flutterwave.service';

// 1. Get Public Key for Frontend
export const getPaystackKey = (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  if (!publicKey) return res.status(500).json({ success: false, message: 'Public key not configured' });
  res.status(200).json({ success: true, key: publicKey });
};

// 2. Escrow-Aware Webhook
export const paystackWebhook = async (req: Request, res: Response) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY as string;
        if (!secret) return res.status(500).send('Secret key missing');

        // Secure HMAC SHA512 Signature Verification
        const hash = crypto.createHmac('sha512', secret)
                           .update(JSON.stringify(req.body))
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(401).send('Invalid signature');
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const orderRef = event.data.reference;

            // Find the matching Escrow order
            const [order] = await db.select().from(orders).where(eq(orders.orderRef, orderRef)).limit(1);
            
            if (!order) {
                return res.status(200).send('Webhook unhandled: Order not found');
            }

            // Idempotency: Prevent re-processing if Paystack fires webhook twice
            if (order.status !== 'pending') {
                return res.status(200).send('Webhook ignored: Order already confirmed');
            }

            // Update order status to paid/confirmed
            await db.update(orders)
                .set({ status: 'confirmed', paymentProofUrl: 'paystack_cleared', updatedAt: new Date() })
                .where(eq(orders.id, order.id));

            // ✨ ESCROW LOGIC: Credit the Pending Balance for the vendor.
            // Deduct the 5% platform fee so the pending balance reflects exactly what the vendor will get.
            const amountInNaira = event.data.amount / 100; 
            const vendorShare = amountInNaira * 0.95; 

            await creditPendingBalance(order.vendorId, vendorShare);

            // Real-time Notification to the Attendee's Tracking Screen
            sendInAppNotification(order.attendeeId, "order:statusUpdate", {
                orderId: orderRef,
                status: "confirmed",
            });
        }

        return res.status(200).send('Webhook received successfully');
    } catch (err) {
        console.error("Paystack Webhook Error:", err);
        return res.status(500).send('Server Error');
    }
};

// 3. Frontend Immediate Verification (Secure Server-to-Server)
export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { orderId, reference, transactionId, provider } = req.body;
        
        let targetOrder;
        if (orderId) {
            [targetOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        } else if (reference) {
            [targetOrder] = await db.select().from(orders).where(eq(orders.orderRef, reference)).limit(1);
        }

        if (!targetOrder) return res.status(404).json({ success: false, message: 'Order not found' });
        
        // Idempotency
        if (targetOrder.status !== 'pending') {
             return res.status(200).json({ success: true, message: 'Order already verified', order: targetOrder });
        }
        
        // Secure Server-to-Server Verification
        let isVerified = false;
        let verifiedAmount = 0;

        if (provider === 'paystack') {
            const data = await verifyPaystack(reference);
            if (data.status === 'success') {
                isVerified = true;
                verifiedAmount = data.amount / 100; // Paystack returns Kobo
            }
        } else if (provider === 'flutterwave') {
            const data = await verifyFlutterwave(transactionId || reference);
            if (data.status === 'successful') {
                isVerified = true;
                verifiedAmount = data.amount;
            }
        }

        if (!isVerified) {
             return res.status(400).json({ success: false, message: 'Payment verification failed at gateway.' });
        }

        // Optional: verify that verifiedAmount >= targetOrder.totalAmount 
        
        await db.update(orders)
            .set({ status: 'confirmed', paymentMethod: provider, paymentProofUrl: `${provider}_cleared`, updatedAt: new Date() })
            .where(eq(orders.id, targetOrder.id));

        const amountInNaira = Number(targetOrder.totalAmount); 
        const vendorShare = amountInNaira * 0.95; 
        await creditPendingBalance(targetOrder.vendorId, vendorShare);

        sendInAppNotification(targetOrder.attendeeId, "order:statusUpdate", { orderId: targetOrder.orderRef, status: "confirmed" });

        return res.status(200).json({ success: true, message: 'Payment verified securely', order: targetOrder });
    } catch (err) {
        console.error("Verify Payment Error:", err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};
