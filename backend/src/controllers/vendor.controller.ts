import { Request, Response } from "express";
import { db } from "../../db";
import { users, vendorProfiles, vendorKyc, products, orders, orderItems } from "../../db/schema";
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
      homeAddress,
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
      businessLicenseId,
      businessPermitId,
      bankName,
      accountNumber,
      accountName,
      govIdType,
      guarantorName,
      guarantorPhone,
      guarantorNin,
      guarantorRelationship,
      guarantors,
      governmentIdFile,
      businessLicenseFile,
      businessPermitFile,
      guarantorIdFile,
      bankReferenceFile,
      cacDocumentFile,
    } = req.body;

    if (!businessName || !bankName || !accountNumber || !accountName || !govIdType || !businessPhone || !stateRegion || !city) {
      return res.status(400).json({ success: false, message: "Missing required profile or KYC fields" });
    }

    if (!guarantors || !Array.isArray(guarantors) || guarantors.length < 2) {
      return res.status(400).json({ success: false, message: "At least two guarantors are required" });
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
          homeAddress,
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
        homeAddress,
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
      businessLicenseId: businessLicenseId || businessPermitId || null,
      businessPermitId: businessPermitId || businessLicenseId || null,
      bankName,
      accountNumber,
      accountName,
      governmentIdType: govIdType,
      guarantorName: guarantorName || '',
      guarantorPhone: guarantorPhone || '',
      guarantorNin: guarantorNin || null,
      guarantorRelationship: guarantorRelationship || '',
      guarantors: guarantors || [],
      governmentIdFile: governmentIdFile || null,
      businessLicenseFile: businessLicenseFile || businessPermitFile || null,
      businessPermitFile: businessPermitFile || businessLicenseFile || null,
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
      referenceId: `KYC-2026-${Math.floor(10000 + Math.random() * 90000)}`
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
      referenceId: `KYC-2026-${kyc.id.substring(0, 5).toUpperCase()}`,
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


// ─── Platform C: Kitchen Merchant Experience Engine ──────────────────────────

interface KitchenRushState {
  isPaused: boolean;
  pausedUntil: string | null;
  pauseReason: string | null;
  addedPrepTimeMinutes: number;
  lastUpdated: string;
}

const vendorRushStates = new Map<string, KitchenRushState>();

// 1. Get Kitchen Rush & Store Pause Status
export const getKitchenRushStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id || 'vendor-sample';
    const state = vendorRushStates.get(vendorId) || {
      isPaused: false,
      pausedUntil: null,
      pauseReason: null,
      addedPrepTimeMinutes: 0,
      lastUpdated: new Date().toISOString(),
    };

    // Auto-unpause if pausedUntil has elapsed
    if (state.isPaused && state.pausedUntil && new Date(state.pausedUntil) <= new Date()) {
      state.isPaused = false;
      state.pausedUntil = null;
      state.pauseReason = null;
      vendorRushStates.set(vendorId, state);
    }

    return res.status(200).json({ success: true, rushState: state });
  } catch (error) {
    console.error('Get Kitchen Rush Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get kitchen rush status' });
  }
};

// 2. Update Kitchen Rush & Store Pause Status
export const updateKitchenRushStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id || 'vendor-sample';
    const { isPaused, pauseDurationMinutes, pauseReason, addedPrepTimeMinutes } = req.body;

    const existing = vendorRushStates.get(vendorId) || {
      isPaused: false,
      pausedUntil: null,
      pauseReason: null,
      addedPrepTimeMinutes: 0,
      lastUpdated: new Date().toISOString(),
    };

    if (isPaused !== undefined) {
      existing.isPaused = Boolean(isPaused);
      if (existing.isPaused && pauseDurationMinutes) {
        existing.pausedUntil = new Date(Date.now() + Number(pauseDurationMinutes) * 60 * 1000).toISOString();
        existing.pauseReason = pauseReason || 'Kitchen rush - clearing active ticket backlog';
      } else if (!existing.isPaused) {
        existing.pausedUntil = null;
        existing.pauseReason = null;
      }
    }

    if (addedPrepTimeMinutes !== undefined) {
      existing.addedPrepTimeMinutes = Math.max(0, Number(addedPrepTimeMinutes));
    }

    existing.lastUpdated = new Date().toISOString();
    vendorRushStates.set(vendorId, existing);

    return res.status(200).json({
      success: true,
      message: existing.isPaused
        ? `Kitchen paused until ${existing.pausedUntil ? new Date(existing.pausedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'resumed'}`
        : `Kitchen active with ${existing.addedPrepTimeMinutes}m buffer prep delay`,
      rushState: existing,
    });
  } catch (error) {
    console.error('Update Kitchen Rush Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update kitchen rush status' });
  }
};

// 3. 80mm Thermal Receipt Cloud Print API
export const getOrderThermalTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const vendorId = req.user?.id;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: products.name,
        modifiers: products.modifiers,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const dateFormatted = new Date(order.createdAt).toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const ticketData = {
      storeName: 'FlowMart Kitchen Express',
      orderRef: order.orderRef || order.id.substring(0, 8).toUpperCase(),
      createdAt: dateFormatted,
      orderType: 'FLOWMART EXPRESS DELIVERY',
      deliveryPin: order.deliveryPin || '8492',
      deliveryAddress: order.deliveryAddress || 'Customer Doorstep',
      deliveryZone: order.deliveryZone || 'Standard Zone',
      paymentMethod: order.paymentMethod?.toUpperCase() || 'PAID ONLINE',
      totalAmount: Number(order.totalAmount),
      items: items.map((it) => ({
        name: it.name,
        qty: it.quantity,
        price: Number(it.unitPrice),
        modifiers: Array.isArray(it.modifiers) ? (it.modifiers as any[]).map(m => m.name || m.optionName || m) : [],
      })),
      notes: 'Please verify delivery PIN with rider upon pickup handover.',
    };

    // Monospaced 80mm ESC/POS line formatted representation
    const divider = '------------------------------------------------';
    const doubleDivider = '================================================';
    const lines = [
      doubleDivider,
      '           FLOWMART KITCHEN DISPATCH TICKET     ',
      doubleDivider,
      `Store:     ${ticketData.storeName}`,
      `Order:     #${ticketData.orderRef}`,
      `Time:      ${ticketData.createdAt}`,
      `Type:      ${ticketData.orderType}`,
      divider,
      `DELIVERY PIN:  >>> ${ticketData.deliveryPin} <<<`,
      divider,
      'ITEMS ORDERED:',
      ...ticketData.items.map(
        (it) => `[${it.qty}x] ${it.name.toUpperCase()} - ₦${(it.qty * it.price).toLocaleString()}`
      ),
      divider,
      `Drop Address: ${ticketData.deliveryAddress}`,
      `Zone:         ${ticketData.deliveryZone}`,
      divider,
      `TOTAL PAID:    ₦${ticketData.totalAmount.toLocaleString()} [${ticketData.paymentMethod}]`,
      doubleDivider,
      '       HANDOVER WITH DELIVERY PIN VERIFICATION  ',
      doubleDivider,
    ];

    const formattedEscPosText = lines.join('\n');

    return res.status(200).json({
      success: true,
      ticketData,
      formattedEscPosText,
    });
  } catch (error) {
    console.error('Thermal Ticket Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate thermal receipt ticket' });
  }
};

// 4. Real-time Item 86 / Out-of-Stock Fast-Toggle
export const toggleProduct86 = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id as string;
    const vendorId = req.user?.id;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const currentStock = product.stockQuantity ?? 0;
    const newStock = currentStock > 0 ? 0 : 50;
    const is86ed = newStock === 0;

    await db
      .update(products)
      .set({ stockQuantity: newStock, updatedAt: new Date() })
      .where(eq(products.id, productId));

    return res.status(200).json({
      success: true,
      message: is86ed
        ? `"${product.name}" has been 86ed (marked Sold Out Today)`
        : `"${product.name}" is back in stock!`,
      is86ed,
      newStock,
      productId,
    });
  } catch (error) {
    console.error('Toggle 86 Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle product stock' });
  }
};


// ─── Sprint G: Kitchen Display System (KDS) Engine ───────────────────────────

export interface KdsTicketItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
  isCompleted: boolean;
}

export interface KdsTicket {
  id: string;
  orderNumber: string;
  customerName: string;
  channel: 'delivery' | 'pickup';
  orderType: 'express' | 'scheduled';
  status: 'new' | 'cooking' | 'ready' | 'dispatched';
  createdAt: string;
  prepMinutes: number;
  targetReadyTime: string;
  delayMinutes: number;
  items: KdsTicketItem[];
  courier?: {
    name: string;
    phone: string;
    etaMinutes: number;
  };
  specialInstructions?: string;
}

const activeKdsTickets: KdsTicket[] = [
  {
    id: "tkt-01",
    orderNumber: "FLW-83921",
    customerName: "Folake Adebayo",
    channel: "delivery",
    orderType: "express",
    status: "cooking",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    prepMinutes: 20,
    targetReadyTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    delayMinutes: 0,
    specialInstructions: "Pack sauce separately in heat-sealed tub. Extra spicy please!",
    courier: {
      name: "Tunde Adebayo",
      phone: "+2348039281726",
      etaMinutes: 6,
    },
    items: [
      { id: "i1", name: "Smoky Party Jollof Rice", quantity: 2, modifiers: ["Extra Shitto", "No Onions"], isCompleted: true },
      { id: "i2", name: "Whole Grilled Catfish (Spicy)", quantity: 1, modifiers: ["Spicy Buka Glaze"], isCompleted: false },
      { id: "i3", name: "Crispy Dodo (Fried Plantain)", quantity: 2, isCompleted: true },
      { id: "i4", name: "Chilled Chapman Drink", quantity: 2, isCompleted: false },
    ],
  },
  {
    id: "tkt-02",
    orderNumber: "FLW-83924",
    customerName: "Babatunde Alabi",
    channel: "delivery",
    orderType: "express",
    status: "new",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    prepMinutes: 15,
    targetReadyTime: new Date(Date.now() + 13 * 60 * 1000).toISOString(),
    delayMinutes: 0,
    specialInstructions: "Corporate lunch bag packaging requested.",
    items: [
      { id: "i5", name: "Smoky Asun Fried Rice", quantity: 1, modifiers: ["Extra Asun Chunks"], isCompleted: false },
      { id: "i6", name: "Peppered Turkey Wing", quantity: 1, isCompleted: false },
      { id: "i7", name: "Bottled Spring Water", quantity: 1, isCompleted: false },
    ],
  },
  {
    id: "tkt-03",
    orderNumber: "FLW-83915",
    customerName: "Chidinma Nwosu",
    channel: "delivery",
    orderType: "express",
    status: "ready",
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    prepMinutes: 20,
    targetReadyTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    delayMinutes: 0,
    courier: {
      name: "Ibrahim Musa",
      phone: "+2348058291024",
      etaMinutes: 2,
    },
    items: [
      { id: "i8", name: "Pounded Yam & Efo Riro", quantity: 1, modifiers: ["Assorted Meat"], isCompleted: true },
      { id: "i9", name: "Fried Titus Fish", quantity: 1, isCompleted: true },
    ],
  },
];

// 1. Get KDS Active Tickets
export const getKdsTickets = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      tickets: activeKdsTickets,
      metrics: {
        newCount: activeKdsTickets.filter(t => t.status === 'new').length,
        cookingCount: activeKdsTickets.filter(t => t.status === 'cooking').length,
        readyCount: activeKdsTickets.filter(t => t.status === 'ready').length,
        avgPrepMinutes: 16.5,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load KDS tickets" });
  }
};

// 2. Update Ticket Status (Accept Cooking, Mark Ready, Handover)
export const updateKdsTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = activeKdsTickets.find(t => t.id === id || t.orderNumber === id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found in KDS" });
    }

    if (['new', 'cooking', 'ready', 'dispatched'].includes(status)) {
      ticket.status = status;
      if (status === 'cooking') {
        ticket.targetReadyTime = new Date(Date.now() + ticket.prepMinutes * 60 * 1000).toISOString();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order ${ticket.orderNumber} updated to ${ticket.status.toUpperCase()}`,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update ticket status" });
  }
};

// 3. Add Prep Delay to Ticket (+5m, +10m, +15m)
export const addKdsTicketDelay = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { additionalMinutes = 5 } = req.body;

    const ticket = activeKdsTickets.find(t => t.id === id || t.orderNumber === id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.delayMinutes += Number(additionalMinutes);
    ticket.prepMinutes += Number(additionalMinutes);
    ticket.targetReadyTime = new Date(new Date(ticket.targetReadyTime).getTime() + additionalMinutes * 60 * 1000).toISOString();

    return res.status(200).json({
      success: true,
      message: `Added +${additionalMinutes} mins prep delay to ${ticket.orderNumber}. New target ready: ${new Date(ticket.targetReadyTime).toLocaleTimeString()}`,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to add prep delay" });
  }
};

// 4. Toggle Preparation Item Completed State
export const toggleKdsTicketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    const ticket = activeKdsTickets.find(t => t.id === id || t.orderNumber === id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const item = ticket.items.find(i => i.id === itemId);
    if (item) {
      item.isCompleted = !item.isCompleted;
    }

    // Auto mark ready if all items completed
    const allDone = ticket.items.every(i => i.isCompleted);
    if (allDone && ticket.status === 'cooking') {
      ticket.status = 'ready';
    }

    return res.status(200).json({
      success: true,
      ticket,
      allDone,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to toggle item state" });
  }
};
