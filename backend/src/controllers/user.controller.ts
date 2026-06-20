import { Response } from 'express';
import { db } from '../../db';
import { users, staffProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { fullName, phone, avatar, dateOfBirth, gender, church, zonal, department, professionalCertification, grade } = req.body;

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

    // Upsert Staff Profile Fields if they exist
    if (church || zonal || department || professionalCertification || grade) {
      const existingProfile = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId)).limit(1);
      
      if (existingProfile.length > 0) {
        await db.update(staffProfiles).set({
          church: church !== undefined ? church : undefined,
          zonal: zonal !== undefined ? zonal : undefined,
          department: department !== undefined ? department : undefined,
          professionalCertification: professionalCertification !== undefined ? professionalCertification : undefined,
          grade: grade !== undefined ? grade : undefined,
          updatedAt: new Date()
        }).where(eq(staffProfiles.userId, userId));
      } else {
        await db.insert(staffProfiles).values({
          userId,
          church,
          zonal,
          department,
          professionalCertification,
          grade
        });
      }
    }

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