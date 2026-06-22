import { Response } from 'express';
import { db } from '../../db';
import { coupons } from '../../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getVendorCoupons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    const vendorCoupons = await db.select().from(coupons).where(eq(coupons.vendorId, vendorId!));
    return res.status(200).json({ success: true, coupons: vendorCoupons });
  } catch (error) {
    console.error('getVendorCoupons Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    const { code, discountType, discountValue, minOrderValue, maxUses, validFrom, validUntil } = req.body;

    const [newCoupon] = await db.insert(coupons)
      .values({
        vendorId: vendorId!,
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderValue,
        maxUses,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      })
      .returning();

    return res.status(201).json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error('createCoupon Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));

    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (!coupon.active) return res.status(400).json({ success: false, message: 'Coupon is inactive' });
    if (new Date() > new Date(coupon.validUntil)) return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    console.error('validateCoupon Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
