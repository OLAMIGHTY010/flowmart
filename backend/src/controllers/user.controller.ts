import { Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fullName, phone, avatar, dateOfBirth, gender } = req.body;

    // Safely format the date as a YYYY-MM-DD string if it exists
    let formattedDob: string | undefined = undefined;
    if (dateOfBirth) {
      // Ensure we extract just the date part for Postgres
      formattedDob = new Date(dateOfBirth).toISOString().split('T')[0];
    }

    const [updatedUser] = await db.update(users).set({
      fullName: fullName || undefined,
      phone: phone !== undefined ? phone : undefined,
      avatar: avatar !== undefined ? avatar : undefined,
      dateOfBirth: formattedDob,
      gender: gender !== undefined ? gender : undefined,
      profileCompleted: true,
      updatedAt: new Date()
    }).where(eq(users.id, userId)).returning();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, ...safeUser } = updatedUser;

    return res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: safeUser 
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};