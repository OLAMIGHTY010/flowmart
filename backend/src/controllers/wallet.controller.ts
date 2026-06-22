import { Response } from 'express';
import { db } from '../../db';
import { wallets, walletTransactions } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getWalletBalance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId!));

    if (!wallet) {
      // Auto-create wallet if it doesn't exist
      [wallet] = await db.insert(wallets).values({ userId: userId!, balance: '0.00' }).returning();
    }

    return res.status(200).json({ success: true, wallet });
  } catch (error) {
    console.error('getWalletBalance Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getWalletTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId!));

    if (!wallet) {
      return res.status(200).json({ success: true, transactions: [] });
    }

    const txs = await db.select().from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt));

    return res.status(200).json({ success: true, transactions: txs });
  } catch (error) {
    console.error('getWalletTransactions Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
