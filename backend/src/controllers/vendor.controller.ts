import { Response } from "express";
import { db } from "../../db";
import { users, vendorProfiles, vendorKyc, products, orders } from "../../db/schema";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Create or Update Vendor Profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    const { displayName, businessName, businessPhone, stateRegion, city, bio, avatar } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!displayName || !businessPhone || !stateRegion || !city) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if profile already exists
    const [existingProfile] = await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.vendorId, vendorId))
      .limit(1);

    if (existingProfile) {
      // Update
      await db
        .update(vendorProfiles)
        .set({
          displayName,
          businessName: businessName || null,
          businessPhone,
          stateRegion,
          city,
          bio: bio || null,
          avatar: avatar || null,
          updatedAt: new Date(),
        })
        .where(eq(vendorProfiles.vendorId, vendorId));
    } else {
      // Insert
      await db.insert(vendorProfiles).values({
        vendorId,
        displayName,
        businessName: businessName || null,
        businessPhone,
        stateRegion,
        city,
        bio: bio || null,
        avatar: avatar || null,
      });
    }

    // Mark user profile as completed
    await db
      .update(users)
      .set({ profileCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, vendorId));

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: { displayName, businessName, businessPhone, stateRegion, city, bio, avatar }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 2. Single KYC Submission (Submit Once)
export const submitKYC = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      // Profile fields
      displayName,
      businessPhone,
      stateRegion,
      city,
      bio,
      avatar,
      
      // KYC fields
      fullName,
      dob,
      gender,
      vendorType,
      tin,
      businessName,
      cacNo,
      campCertificateId,
      bankName,
      accountNumber,
      accountName,
      govIdType,
      guarantorName,
      guarantorPhone,
      guarantorRelationship,
      governmentIdFile,
      campCertificateFile,
      guarantorIdFile,
      bankReferenceFile,
      cacDocumentFile,
    } = req.body;

    if (!businessName || !bankName || !accountNumber || !accountName || !govIdType || !guarantorName || !guarantorPhone || !businessPhone || !stateRegion || !city) {
      return res.status(400).json({ success: false, message: "Missing required profile or KYC fields" });
    }

    // 1. CREATE OR UPDATE VENDOR PROFILE
    const [existingProfile] = await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.vendorId, vendorId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(vendorProfiles)
        .set({
          displayName: displayName || fullName,
          businessName: businessName || null,
          businessPhone,
          stateRegion,
          city,
          bio: bio || null,
          avatar: avatar || null,
          updatedAt: new Date(),
        })
        .where(eq(vendorProfiles.vendorId, vendorId));
    } else {
      await db.insert(vendorProfiles).values({
        vendorId,
        displayName: displayName || fullName,
        businessName: businessName || null,
        businessPhone,
        stateRegion,
        city,
        bio: bio || null,
        avatar: avatar || null,
      });
    }

    // Mark user profile as completed and update personal info
    await db
      .update(users)
      .set({ 
        fullName: fullName || displayName, 
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        profileCompleted: true, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, vendorId));

    // Check if KYC entry exists
    const [existingKyc] = await db
      .select()
      .from(vendorKyc)
      .where(eq(vendorKyc.vendorId, vendorId))
      .limit(1);

    const kycData = {
      vendorId,
      vendorType: vendorType || 'individual',
      businessName,
      cacNo: cacNo || null,
      tin: tin || null,
      campCertificateId: campCertificateId || null,
      bankName,
      accountNumber,
      accountName,
      governmentIdType: govIdType,
      guarantorName,
      guarantorPhone,
      guarantorRelationship,
      governmentIdFile: governmentIdFile || null,
      campCertificateFile: campCertificateFile || null,
      guarantorIdFile: guarantorIdFile || null,
      bankReferenceFile: bankReferenceFile || null,
      cacDocumentFile: cacDocumentFile || null,
      status: "under_review", // Change to under review on submission
      updatedAt: new Date(),
    };

    if (existingKyc) {
      await db.update(vendorKyc).set(kycData).where(eq(vendorKyc.vendorId, vendorId));
    } else {
      await db.insert(vendorKyc).values({
        ...kycData,
        status: "under_review",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KYC submitted successfully for review",
      referenceId: `KYC-2024-${Math.floor(10000 + Math.random() * 90000)}`
    });
  } catch (error) {
    console.error("Submit KYC Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 3. Get KYC Status
export const getKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [kyc] = await db
      .select()
      .from(vendorKyc)
      .where(eq(vendorKyc.vendorId, vendorId))
      .limit(1);

    if (!kyc) {
      return res.status(200).json({
        success: true,
        status: "unsubmitted",
        referenceId: "KYC-NEW-VENDOR",
        steps: [
          { label: "Application Submitted", time: "Pending", status: "pending" },
          { label: "Document Review", time: "Pending", status: "pending" },
          { label: "Admin Verification", time: "Pending", status: "pending" },
          { label: "Account Activated", time: "Pending", status: "pending" }
        ]
      });
    }

    const steps = [
      { 
        label: "Application Submitted", 
        time: kyc.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        status: "done" as const 
      },
      { 
        label: "Document Review", 
        time: kyc.status === "under_review" ? "In Progress" : kyc.status === "approved" ? "Completed" : "Pending", 
        status: kyc.status === "under_review" ? ("active" as const) : kyc.status === "approved" ? ("done" as const) : ("pending" as const)
      },
      { 
        label: "Admin Verification", 
        time: kyc.status === "approved" ? "Completed" : "Pending", 
        status: kyc.status === "approved" ? ("done" as const) : ("pending" as const)
      },
      { 
        label: "Account Activated", 
        time: kyc.status === "approved" ? "Active" : "Pending", 
        status: kyc.status === "approved" ? ("done" as const) : ("pending" as const)
      }
    ];

    return res.status(200).json({
      success: true,
      status: kyc.status,
      referenceId: `KYC-2024-${kyc.id.substring(0, 5).toUpperCase()}`,
      steps
    });
  } catch (error) {
    console.error("Get KYC Status Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 4. Get Vendor Dashboard Statistics
export const getVendorStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch all products for this vendor to calculate stock
    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const availableStock = vendorProducts.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);

    // Fetch all orders for this vendor
    const vendorOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const newOrders = vendorOrders.filter(o => o.status === "pending").length;
    const inProgress = vendorOrders.filter(o => ["confirmed", "assigned", "picked_up"].includes(o.status)).length;

    // Calculate revenue
    const deliveredOrders = vendorOrders.filter(o => o.status === "delivered");
    const totalRevNum = deliveredOrders.reduce((acc, o) => acc + parseFloat(o.totalAmount || "0"), 0);
    const avgOrderNum = vendorOrders.length > 0
      ? vendorOrders.reduce((acc, o) => acc + parseFloat(o.totalAmount || "0"), 0) / vendorOrders.length
      : 0;

    const formatCurrency = (num: number) => {
      if (num >= 1000) {
        return `₦${(num / 1000).toFixed(0)}K`;
      }
      return `₦${num.toLocaleString()}`;
    };

    const weeklyRevData = [0,0,0,0,0,0,0];
    const today = new Date();
    deliveredOrders.forEach(o => {
      const orderDate = new Date(o.createdAt);
      const diffTime = today.getTime() - orderDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 7) {
        const dayIdx = (orderDate.getDay() + 6) % 7; // Monday=0, Sun=6
        weeklyRevData[dayIdx] += parseFloat(o.totalAmount || "0");
      }
    });
    
    const maxRev = Math.max(...weeklyRevData, 1);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyRevenue = days.map((day, i) => ({
      day,
      h: Math.round((weeklyRevData[i] / maxRev) * 100)
    }));

    return res.status(200).json({
      success: true,
      newOrders,
      inProgress,
      revenueToday: formatCurrency(totalRevNum),
      availableStock,
      weeklyRevenue,
      totalRevenue: formatCurrency(totalRevNum),
      avgOrder: formatCurrency(avgOrderNum),
    });
  } catch (error) {
    console.error("Get Vendor Stats Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
