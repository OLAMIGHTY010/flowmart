import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { billsService } from '../services/bills.service';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const getBillCategories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query; // 'airtime' | 'data' | 'power' | 'cable'
    if (!type) {
      return res.status(400).json({ success: false, message: 'Bill type is required' });
    }

    const categories = await billsService.getBillCategories(type as any);
    return res.status(200).json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemCode, customer, billerCode } = req.query;
    if (!itemCode || !customer || !billerCode) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const validation = await billsService.validateCustomer(itemCode as string, customer as string, billerCode as string);
    return res.status(200).json({ success: true, data: validation.data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const processBillPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, customer, amount, billerCode, itemCode } = req.body;

    if (!category || !customer || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 1. Check user wallet balance
    const { wallets } = await import('../../db/schema');
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Wallet not found' });
    }
    
    const currentBalance = Number(wallet.balance);

    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const reference = `BILL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // 2. Process via Flutterwave (or mock)
    const paymentResult = await billsService.payBill({
      category,
      customer,
      amount,
      billerCode,
      itemCode,
      reference
    });

    // 3. Deduct from wallet if successful
    await db.update(wallets)
      .set({ balance: sql`${wallets.balance} - ${amount}` })
      .where(eq(wallets.id, wallet.id));

    // Optional: Log the transaction in a transactions table if it existed

    return res.status(200).json({
      success: true,
      message: 'Bill payment successful',
      data: paymentResult.data,
      reference
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Bill payment failed' });
  }
};
