import { Request, Response } from 'express';
import { db } from '../../db';
import { users, vendorProfiles, vendorKyc, vendorKycHistory, products } from '../../db/schema';
import { eq, sql, and, desc, asc } from 'drizzle-orm';
import { sendEmail } from '../services/email';

export const getVendorApprovalStats = async (req: Request, res: Response) => {
  try {
    const allKyc = await db.select().from(vendorKyc);
    
    let pendingReview = 0;
    let approvedThisMonth = 0;
    let rejected = 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    allKyc.forEach(kyc => {
      if (kyc.status === 'pending' || kyc.status === 'under_review') {
        pendingReview++;
      } else if (kyc.status === 'rejected') {
        rejected++;
      } else if (kyc.status === 'approved') {
        const updatedAt = new Date(kyc.updatedAt);
        if (updatedAt >= startOfMonth) {
          approvedThisMonth++;
        }
      }
    });

    return res.status(200).json({
      success: true,
      stats: { pendingReview, approvedThisMonth, rejected }
    });
  } catch (error) {
    console.error("Error in getVendorApprovalStats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getVendorsList = async (req: Request, res: Response) => {
  try {
    const { status, category } = req.query;

    const query = db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      businessName: vendorKyc.businessName,
      status: vendorKyc.status,
      cacNo: vendorKyc.cacNo,
      createdAt: vendorKyc.createdAt,
    })
    .from(vendorKyc)
    .innerJoin(users, eq(users.id, vendorKyc.vendorId))
    .orderBy(desc(vendorKyc.createdAt));

    const vendorsList = await query;

    // Filter in memory for simplicity (since category isn't directly on vendorKyc right now, but we could add it)
    let filtered = vendorsList;

    if (status && status !== 'all') {
      if (status === 'pending') {
        filtered = filtered.filter(v => v.status === 'pending' || v.status === 'under_review');
      } else {
        filtered = filtered.filter(v => v.status === status);
      }
    }
    
    // We don't have a direct category field on vendor right now, so we will just return them.
    // In a real app we'd join with products category or add a primary category to vendorProfiles.

    // Calculate a mock compliance score based on filled fields
    const enriched = await Promise.all(filtered.map(async (v) => {
      const kycDataList = await db.select().from(vendorKyc).where(eq(vendorKyc.vendorId, v.id)).limit(1);
      const kycData = kycDataList[0];
      
      let score = 0;
      if (kycData) {
        if (kycData.cacNo) score += 20;
        if (kycData.governmentIdFile) score += 20;
        if (kycData.guarantorIdFile) score += 20;
        if (kycData.bankName && kycData.accountNumber) score += 20;
        if (kycData.campCertificateFile) score += 20;
      }

      return {
        ...v,
        complianceScore: score,
        // Mock category for UI purposes since we don't store it yet
        category: 'Logistics', 
        logo: v.businessName?.charAt(0) || v.fullName?.charAt(0) || 'V'
      };
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error in getVendorsList:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getVendorDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const kycRecord = await db.select().from(vendorKyc).where(eq(vendorKyc.vendorId, id as string)).limit(1);
    const profileRecord = await db.select().from(vendorProfiles).where(eq(vendorProfiles.vendorId, id as string)).limit(1);
    const userRecord = await db.select().from(users).where(eq(users.id, id as string)).limit(1);

    if (!kycRecord.length || !userRecord.length) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const history = await db.select()
      .from(vendorKycHistory)
      .where(eq(vendorKycHistory.vendorId, id as string))
      .orderBy(desc(vendorKycHistory.createdAt));

    const kycData = kycRecord[0];
    let score = 0;
    if (kycData.cacNo) score += 20;
    if (kycData.governmentIdFile) score += 20;
    if (kycData.guarantorIdFile) score += 20;
    if (kycData.bankName && kycData.accountNumber) score += 20;
    if (kycData.campCertificateFile) score += 20;

    return res.status(200).json({
      success: true,
      data: {
        user: userRecord[0],
        profile: profileRecord[0] || null,
        kyc: kycData,
        complianceScore: score,
        history
      }
    });
  } catch (error) {
    console.error("Error in getVendorDetails:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const reviewVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const reviewerId = (req as any).user?.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const kycRecord = await db.select().from(vendorKyc).where(eq(vendorKyc.vendorId, id as string)).limit(1);
    const userRecord = await db.select().from(users).where(eq(users.id, id as string)).limit(1);

    if (!kycRecord.length || !userRecord.length) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    // Update KYC status
    await db.update(vendorKyc)
      .set({ status, updatedAt: new Date() })
      .where(eq(vendorKyc.vendorId, id as string));

    // Log history
    await db.insert(vendorKycHistory).values({
      vendorId: id as string,
      action: status,
      notes: notes || '',
      reviewerId: reviewerId || null
    });

    // Send Email
    const userEmail = userRecord[0].email;
    const subject = status === 'approved' ? "Your FlowMart Vendor Application is Approved!" : "Update on your FlowMart Vendor Application";
    
    let htmlContent = '';
    if (status === 'approved') {
      htmlContent = `<p>Hello ${userRecord[0].fullName},</p><p>Congratulations! Your vendor profile has been <b>approved</b>.</p><p>You can now log in and start adding products.</p>`;
    } else {
      htmlContent = `<p>Hello ${userRecord[0].fullName},</p><p>Unfortunately, your vendor application has been <b>rejected</b>.</p><p><b>Reason:</b> ${notes}</p><p>Please update your profile and try again.</p>`;
    }

    try {
      await sendEmail(
        userEmail,
        subject,
        htmlContent.replace(/<[^>]+>/g, ''), // Strip tags for text version
        htmlContent
      );
    } catch (e) {
      console.warn("Failed to send review email", e);
    }

    return res.status(200).json({ success: true, message: `Vendor ${status} successfully` });
  } catch (error) {
    console.error("Error in reviewVendor:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
