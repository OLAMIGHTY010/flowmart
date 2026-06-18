import { Response } from 'express';
import { db } from '../../db';
import { vendorProfiles, kycSubmissions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 1. Save Basic Vendor Business & Bank Info
export const saveVendorProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { businessName, cacNo, campCertificateId, bankName, accountNumber, accountName } = req.body;

    // Upsert logic for Vendor Profile
    const existingProfile = await db.select().from(vendorProfiles).where(eq(vendorProfiles.userId, userId)).limit(1);

    if (existingProfile.length > 0) {
      await db.update(vendorProfiles).set({
        businessName, cacNo, campCertificateId, bankName, accountNumber, accountName, updatedAt: new Date()
      }).where(eq(vendorProfiles.userId, userId));
    } else {
      await db.insert(vendorProfiles).values({
        userId, businessName, cacNo, campCertificateId, bankName, accountNumber, accountName
      });
    }

    // Ensure a KYC tracking record exists
    const existingKyc = await db.select().from(kycSubmissions).where(eq(kycSubmissions.vendorId, userId)).limit(1);
    if (existingKyc.length === 0) {
      await db.insert(kycSubmissions).values({ vendorId: userId, status: 'unsubmitted' });
    }

    return res.status(200).json({ success: true, message: 'Vendor profile saved' });
  } catch (error) {
    console.error('Save Vendor Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 2. Submit Final KYC Docs
export const submitKYC = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { governmentIdType, guarantorName, guarantorPhone, guarantorRelationship, governmentIdUrl, campCertificateUrl } = req.body;

    const referenceId = `KYC-${Math.floor(100000 + Math.random() * 900000)}`;

    const [updatedKyc] = await db.update(kycSubmissions).set({
      governmentIdType,
      guarantorName,
      guarantorPhone,
      guarantorRelationship,
      governmentIdUrl,
      campCertificateUrl,
      status: 'pending',
      referenceId,
      updatedAt: new Date()
    }).where(eq(kycSubmissions.vendorId, userId)).returning();

    return res.status(200).json({ success: true, message: 'KYC Submitted successfully', kyc: updatedKyc });
  } catch (error) {
    console.error('KYC Submit Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 3. Get KYC Status
export const getKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [kyc] = await db.select().from(kycSubmissions).where(eq(kycSubmissions.vendorId, userId)).limit(1);

    if (!kyc) {
       return res.status(200).json({ 
         status: 'unsubmitted', 
         referenceId: '', 
         steps: [] 
       });
    }

    return res.status(200).json({
      status: kyc.status,
      referenceId: kyc.referenceId,
      steps: [
        { label: 'Profile Setup', status: 'done' },
        { label: 'KYC Information', status: kyc.status === 'unsubmitted' ? 'active' : 'done' },
        { label: 'Document Upload', status: kyc.status === 'pending' || kyc.status === 'approved' ? 'done' : 'active' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
