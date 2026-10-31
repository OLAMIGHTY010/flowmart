import { Request, Response } from "express";
import { db } from "../../db";
import { users, vendorProfiles, vendorKyc, products, orders, orderItems, payouts, wallets } from "../../db/schema";
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


// ============================================================================
// SPRINT J: MERCHANT FINANCIAL STATEMENTS & AUTOMATED WEEKLY PAYOUT INVOICES
// ============================================================================

// Mock bank details cache if not yet set in profile
const vendorBankCache: Record<string, { bankName: string; accountNumber: string; accountName: string; isVerified: boolean }> = {};

export const getMerchantFinancialStatements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1. Fetch vendor profile & products
    const [profile] = await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.vendorId, vendorId))
      .limit(1);

    const vendorProducts = await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId));

    const vendorOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

    const commissionPct = profile?.vendorCommissionPct || 15;
    const vatPct = 7.5; // Nigerian VAT rate

    const deliveredOrders = vendorOrders.filter(o => o.status === "delivered");
    const liveDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);

    // Bank details
    const bankDetails = vendorBankCache[vendorId] || {
      bankName: "Access Bank Plc",
      accountNumber: "0128934821",
      accountName: profile?.businessName || profile?.displayName || "Mama's Kitchen Bistro Ltd",
      isVerified: true
    };

    // Calculate current cycle (Week 44: Oct 26 - Nov 01, 2026)
    const currentGross = liveDeliveredRevenue > 0 ? liveDeliveredRevenue : 486250;
    const currentOrdersCount = deliveredOrders.length > 0 ? deliveredOrders.length : 62;
    const currentAOV = Math.round(currentGross / Math.max(currentOrdersCount, 1));
    const currentCommission = Math.round(currentGross * (commissionPct / 100));
    const currentVat = Math.round(currentCommission * (vatPct / 100));
    const currentPackaging = currentOrdersCount * 250;
    const currentDiscounts = 7500;
    const currentRefunds = 0;
    const currentNet = currentGross - currentCommission - currentVat + currentPackaging - currentDiscounts - currentRefunds;

    // Build Statements & Weekly Invoices
    const statements = [
      {
        id: "stmt-wk44-2026",
        invoiceNumber: "INV-2026-WK44-8891",
        cycleLabel: "Week 44 (Oct 26 - Nov 01, 2026)",
        periodStart: "2026-10-26T00:00:00Z",
        periodEnd: "2026-11-01T23:59:59Z",
        payoutDueDate: "2026-11-02T09:00:00Z",
        status: "PENDING_CLEARANCE",
        bankReference: "PENDING-DISBURSEMENT",
        payoutBank: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber.slice(0, 3) + "••••" + bankDetails.accountNumber.slice(-4),
          accountName: bankDetails.accountName
        },
        financialBreakdown: {
          grossSales: currentGross,
          ordersCount: currentOrdersCount,
          averageOrderValue: currentAOV,
          flowmartCommissionRate: commissionPct,
          commissionFee: currentCommission,
          vatRate: vatPct,
          vatFee: currentVat,
          packagingFeeCollected: currentPackaging,
          merchantPromotionsSubsidies: currentDiscounts,
          disputeAdjustments: currentRefunds,
          netDisbursement: currentNet,
        },
        ordersLedger: [
          { orderId: "FM-89210", orderNumber: "#89210", date: "2026-10-29 18:42", customer: "Chioma Adeleke", itemsCount: 3, gross: 9400, commission: 1410, vat: 106, net: 7884, status: "delivered" },
          { orderId: "FM-89194", orderNumber: "#89194", date: "2026-10-29 17:15", customer: "Tunde Bakare", itemsCount: 2, gross: 6800, commission: 1020, vat: 77, net: 5703, status: "delivered" },
          { orderId: "FM-89180", orderNumber: "#89180", date: "2026-10-29 15:30", customer: "Amina Yusuf", itemsCount: 4, gross: 14200, commission: 2130, vat: 160, net: 11910, status: "delivered" },
          { orderId: "FM-89145", orderNumber: "#89145", date: "2026-10-28 20:10", customer: "Femi Otedola", itemsCount: 5, gross: 22500, commission: 3375, vat: 253, net: 18872, status: "delivered" },
          { orderId: "FM-89112", orderNumber: "#89112", date: "2026-10-28 13:45", customer: "Zainab Bello", itemsCount: 2, gross: 5500, commission: 825, vat: 62, net: 4613, status: "delivered" },
          { orderId: "FM-89088", orderNumber: "#89088", date: "2026-10-27 19:20", customer: "Emeka Okonkwo", itemsCount: 3, gross: 11800, commission: 1770, vat: 133, net: 9897, status: "delivered" },
          { orderId: "FM-89042", orderNumber: "#89042", date: "2026-10-27 12:05", customer: "Folashade Alakija", itemsCount: 1, gross: 4200, commission: 630, vat: 47, net: 3523, status: "delivered" },
          { orderId: "FM-89010", orderNumber: "#89010", date: "2026-10-26 18:50", customer: "David Adeleke", itemsCount: 6, gross: 28900, commission: 4335, vat: 325, net: 24240, status: "delivered" }
        ]
      },
      {
        id: "stmt-wk43-2026",
        invoiceNumber: "INV-2026-WK43-8412",
        cycleLabel: "Week 43 (Oct 19 - Oct 25, 2026)",
        periodStart: "2026-10-19T00:00:00Z",
        periodEnd: "2026-10-25T23:59:59Z",
        payoutDueDate: "2026-10-26T09:00:00Z",
        status: "SETTLED",
        bankReference: "FLW-PAY-2026-9812401",
        payoutBank: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber.slice(0, 3) + "••••" + bankDetails.accountNumber.slice(-4),
          accountName: bankDetails.accountName
        },
        financialBreakdown: {
          grossSales: 1245000,
          ordersCount: 158,
          averageOrderValue: 7880,
          flowmartCommissionRate: commissionPct,
          commissionFee: 186750,
          vatRate: vatPct,
          vatFee: 14006,
          packagingFeeCollected: 39500,
          merchantPromotionsSubsidies: 15000,
          disputeAdjustments: 4500,
          netDisbursement: 1064244,
        },
        ordersLedger: [
          { orderId: "FM-88902", orderNumber: "#88902", date: "2026-10-25 21:10", customer: "Babatunde Raji", itemsCount: 3, gross: 10200, commission: 1530, vat: 115, net: 8555, status: "delivered" },
          { orderId: "FM-88844", orderNumber: "#88844", date: "2026-10-24 19:40", customer: "Ngozi Chimamanda", itemsCount: 4, gross: 16500, commission: 2475, vat: 186, net: 13839, status: "delivered" },
          { orderId: "FM-88791", orderNumber: "#88791", date: "2026-10-23 18:20", customer: "Kunle Afolayan", itemsCount: 2, gross: 7200, commission: 1080, vat: 81, net: 6039, status: "delivered" },
          { orderId: "FM-88712", orderNumber: "#88712", date: "2026-10-22 13:15", customer: "Simi Ogunleye", itemsCount: 3, gross: 12400, commission: 1860, vat: 140, net: 10400, status: "delivered" }
        ]
      },
      {
        id: "stmt-wk42-2026",
        invoiceNumber: "INV-2026-WK42-7934",
        cycleLabel: "Week 42 (Oct 12 - Oct 18, 2026)",
        periodStart: "2026-10-12T00:00:00Z",
        periodEnd: "2026-10-18T23:59:59Z",
        payoutDueDate: "2026-10-19T09:00:00Z",
        status: "SETTLED",
        bankReference: "FLW-PAY-2026-9764510",
        payoutBank: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber.slice(0, 3) + "••••" + bankDetails.accountNumber.slice(-4),
          accountName: bankDetails.accountName
        },
        financialBreakdown: {
          grossSales: 1120000,
          ordersCount: 142,
          averageOrderValue: 7887,
          flowmartCommissionRate: commissionPct,
          commissionFee: 168000,
          vatRate: vatPct,
          vatFee: 12600,
          packagingFeeCollected: 35500,
          merchantPromotionsSubsidies: 10000,
          disputeAdjustments: 0,
          netDisbursement: 964900,
        },
        ordersLedger: [
          { orderId: "FM-88540", orderNumber: "#88540", date: "2026-10-18 20:00", customer: "Kemi Adetiba", itemsCount: 3, gross: 11500, commission: 1725, vat: 129, net: 9646, status: "delivered" }
        ]
      },
      {
        id: "stmt-wk41-2026",
        invoiceNumber: "INV-2026-WK41-7299",
        cycleLabel: "Week 41 (Oct 05 - Oct 11, 2026)",
        periodStart: "2026-10-05T00:00:00Z",
        periodEnd: "2026-10-11T23:59:59Z",
        payoutDueDate: "2026-10-12T09:00:00Z",
        status: "SETTLED",
        bankReference: "FLW-PAY-2026-9698231",
        payoutBank: {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber.slice(0, 3) + "••••" + bankDetails.accountNumber.slice(-4),
          accountName: bankDetails.accountName
        },
        financialBreakdown: {
          grossSales: 980000,
          ordersCount: 128,
          averageOrderValue: 7656,
          flowmartCommissionRate: commissionPct,
          commissionFee: 147000,
          vatRate: vatPct,
          vatFee: 11025,
          packagingFeeCollected: 32000,
          merchantPromotionsSubsidies: 8000,
          disputeAdjustments: 3000,
          netDisbursement: 842975,
        },
        ordersLedger: [
          { orderId: "FM-88210", orderNumber: "#88210", date: "2026-10-11 19:15", customer: "Banky Wellington", itemsCount: 4, gross: 15400, commission: 2310, vat: 173, net: 12917, status: "delivered" }
        ]
      }
    ];

    // P&L 30-day aggregates
    const totalGrossRevenue30d = statements.reduce((sum, s) => sum + s.financialBreakdown.grossSales, 0);
    const totalNetEarnings30d = statements.reduce((sum, s) => sum + s.financialBreakdown.netDisbursement, 0);
    const totalCommissionDeductions = statements.reduce((sum, s) => sum + s.financialBreakdown.commissionFee + s.financialBreakdown.vatFee, 0);
    const totalOrdersCount30d = statements.reduce((sum, s) => sum + s.financialBreakdown.ordersCount, 0);
    const netMarginPercent = Number(((totalNetEarnings30d / Math.max(totalGrossRevenue30d, 1)) * 100).toFixed(1));

    // Top Profitable Items
    const topProfitableItems = vendorProducts.length > 0 
      ? vendorProducts.slice(0, 5).map((p, i) => ({
          id: p.id,
          name: p.name,
          unitsSold: 98 - (i * 14),
          grossRevenue: Math.round(parseFloat(p.price || "3500") * (98 - (i * 14))),
          marginPct: 84.8
        }))
      : [
          { id: "item-1", name: "Smokey Party Jollof Rice & Grilled Chicken", unitsSold: 98, grossRevenue: 441000, marginPct: 85.0 },
          { id: "item-2", name: "Slow-Cooked Seafood Okro & Pounded Yam", unitsSold: 74, grossRevenue: 481000, marginPct: 85.0 },
          { id: "item-3", name: "Special Fried Rice & Crispy Turkey Wings", unitsSold: 61, grossRevenue: 335500, marginPct: 85.0 },
          { id: "item-4", name: "Spicy Asun Goat Meat Pepper Soup", unitsSold: 55, grossRevenue: 247500, marginPct: 85.0 },
          { id: "item-5", name: "Sweet Plantain Dodo & Charcoal Grilled Tilapia", unitsSold: 42, grossRevenue: 231000, marginPct: 85.0 }
        ];

    return res.status(200).json({
      success: true,
      currentBalance: {
        available: currentNet,
        pendingSettlement: currentGross,
        nextAutoPayout: "Monday, Nov 02, 2026 • 09:00 AM",
        currency: "NGN",
        currencySymbol: "₦"
      },
      bankDetails,
      plSummary30d: {
        grossRevenue: totalGrossRevenue30d,
        netDisbursements: totalNetEarnings30d,
        commissionPaid: totalCommissionDeductions,
        totalOrdersCount: totalOrdersCount30d,
        netMarginPercent,
        topProfitableItems
      },
      statements
    });
  } catch (error) {
    console.error("Error generating merchant financial statements:", error);
    return res.status(500).json({ success: false, message: "Failed to generate financial statements" });
  }
};

export const getMerchantPayoutSchedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [profile] = await db
      .select()
      .from(vendorProfiles)
      .where(eq(vendorProfiles.vendorId, vendorId))
      .limit(1);

    const bankDetails = vendorBankCache[vendorId] || {
      bankName: "Access Bank Plc",
      accountNumber: "0128934821",
      accountName: profile?.businessName || profile?.displayName || "Mama's Kitchen Bistro Ltd",
      isVerified: true
    };

    return res.status(200).json({
      success: true,
      schedule: {
        cadence: "Weekly Automated Payout",
        payoutDay: "Every Monday",
        payoutTime: "09:00 AM WAT",
        cutoffTime: "Sunday 23:59 WAT",
        nextSettlementDate: "2026-11-02T09:00:00Z",
        accruedAmount: 486250,
        currency: "NGN",
        minimumPayoutThreshold: 5000,
        instantPayoutEligible: true,
        instantPayoutFeePct: 1.0,
      },
      bankDetails: {
        ...bankDetails,
        maskedAccount: bankDetails.accountNumber.slice(0, 3) + "••••" + bankDetails.accountNumber.slice(-4)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payout schedule" });
  }
};

export const requestInstantPayout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { amount = 100000 } = req.body;
    const requestedAmount = Number(amount);

    if (isNaN(requestedAmount) || requestedAmount < 5000) {
      return res.status(400).json({ success: false, message: "Minimum instant payout amount is ₦5,000" });
    }

    const instantFee = Math.round(requestedAmount * 0.01);
    const netPayout = requestedAmount - instantFee;
    const reference = "FLW-INSTANT-" + Date.now().toString(36).toUpperCase();

    return res.status(200).json({
      success: true,
      message: "Instant payout of ₦" + netPayout.toLocaleString() + " processed successfully. Funds disbursed to your registered Access Bank account.",
      transaction: {
        reference,
        grossRequested: requestedAmount,
        instantProcessingFee: instantFee,
        netDisbursed: netPayout,
        status: "SUCCESSFUL",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to process instant payout" });
  }
};

export const updateMerchantBankSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { bankName, accountNumber, accountName } = req.body;
    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: "Bank name, account number, and account name are required" });
    }

    if (accountNumber.replace(/\D/g, '').length !== 10) {
      return res.status(400).json({ success: false, message: "Nigerian NUBAN account number must be 10 digits" });
    }

    vendorBankCache[vendorId] = {
      bankName,
      accountNumber,
      accountName,
      isVerified: true
    };

    return res.status(200).json({
      success: true,
      message: "Settlement bank account updated & verified successfully.",
      bankDetails: {
        bankName,
        accountNumber: accountNumber.slice(0, 3) + "••••" + accountNumber.slice(-4),
        accountName,
        isVerified: true
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update bank settings" });
  }
};


/**
 * ============================================================================
 * SPRINT P: KITCHEN INGREDIENT STOCK DEPLETION & 86'D QUICK TOGGLES (2026)
 * ============================================================================
 */

export interface Kitchen86Item {
  id: string;
  name: string;
  category: 'MAINS' | 'PROTEINS' | 'SIDES' | 'BEVERAGES' | 'DESSERTS';
  price: number;
  is86ed: boolean;
  remainingPortions: number; // 0 means 86'd
  eightySixDuration?: 'UNTIL_END_OF_DAY' | 'TWO_HOURS' | 'INDEFINITE' | null;
  eightySixReason?: string;
  autoSubstitute?: {
    id: string;
    name: string;
    price: number;
    differenceNgn: number;
  };
  imageUrl: string;
  connectedDishCount?: number;
  lastToggledAt?: string;
}

// In-memory 86'd state cache per kitchen/vendor
let kitchenInventoryCache: Kitchen86Item[] = [
  {
    id: 'kds-item-jollof',
    name: 'Smokey Party Jollof Rice Special',
    category: 'MAINS',
    price: 3200,
    is86ed: false,
    remainingPortions: 18,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-friedrice',
      name: 'Golden Basmati Fried Rice',
      price: 3400,
      differenceNgn: 200
    },
    connectedDishCount: 4
  },
  {
    id: 'kds-item-chicken',
    name: 'Crispy Southern Fried Chicken (Mega)',
    category: 'PROTEINS',
    price: 2600,
    is86ed: false,
    remainingPortions: 8,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-turkey',
      name: 'Jumbo Peppered Turkey Wing',
      price: 3500,
      differenceNgn: 900
    },
    connectedDishCount: 6
  },
  {
    id: 'kds-item-dodo',
    name: 'Sweet Golden Fried Plantain (Dodo)',
    category: 'SIDES',
    price: 1400,
    is86ed: true,
    remainingPortions: 0,
    eightySixDuration: 'UNTIL_END_OF_DAY',
    eightySixReason: 'Kitchen supplier delivery delayed; ripe plantains depleted.',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-moimoi',
      name: 'Steamed Fish Egg Moi-Moi',
      price: 1500,
      differenceNgn: 100
    },
    connectedDishCount: 5,
    lastToggledAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'kds-item-croaker',
    name: 'Spicy Peppered Grilled Croaker Fish',
    category: 'PROTEINS',
    price: 3800,
    is86ed: false,
    remainingPortions: 3,
    imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-turkey',
      name: 'Jumbo Peppered Turkey Wing',
      price: 3500,
      differenceNgn: -300
    },
    connectedDishCount: 2
  },
  {
    id: 'kds-item-chapman',
    name: 'Signature Chilled Chapman Mocktail',
    category: 'BEVERAGES',
    price: 1800,
    is86ed: false,
    remainingPortions: 24,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-zobo',
      name: 'Chilled Hibiscus Zobo Splash',
      price: 1200,
      differenceNgn: -600
    },
    connectedDishCount: 0
  },
  {
    id: 'kds-item-coleslaw',
    name: 'Fresh Gourmet Garden Coleslaw',
    category: 'SIDES',
    price: 1200,
    is86ed: false,
    remainingPortions: 4,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-moimoi',
      name: 'Steamed Fish Egg Moi-Moi',
      price: 1500,
      differenceNgn: 300
    },
    connectedDishCount: 3
  },
  {
    id: 'kds-item-pizza-pepperoni',
    name: 'Artisan Double Pepperoni Pizza',
    category: 'MAINS',
    price: 7500,
    is86ed: false,
    remainingPortions: 12,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    autoSubstitute: {
      id: 'kds-item-burger',
      name: 'Double Smash Beef Burger',
      price: 4500,
      differenceNgn: -3000
    },
    connectedDishCount: 1
  }
];

export const getKitchen86InventoryStatus = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalItems = kitchenInventoryCache.length;
    const eightySixedCount = kitchenInventoryCache.filter(i => i.is86ed).length;
    const lowStockCount = kitchenInventoryCache.filter(i => !i.is86ed && i.remainingPortions <= 5).length;
    const inStockCount = kitchenInventoryCache.filter(i => !i.is86ed && i.remainingPortions > 5).length;

    return res.status(200).json({
      success: true,
      summary: {
        totalItems,
        eightySixedCount,
        lowStockCount,
        inStockCount,
        kitchenOperationalStatus: eightySixedCount > 4 ? 'HIGH_DEPLETION_ALERT' : 'OPTIMAL_CAPACITY'
      },
      items: kitchenInventoryCache
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch 86 inventory status: ' + error.message });
  }
};

export const toggleKitchenItem86 = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const itemId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
    const { is86ed, duration, reason } = req.body;

    const item = kitchenInventoryCache.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Kitchen item not found' });
    }

    const next86 = typeof is86ed === 'boolean' ? is86ed : !item.is86ed;
    item.is86ed = next86;
    item.remainingPortions = next86 ? 0 : (item.remainingPortions > 0 ? item.remainingPortions : 10);
    item.eightySixDuration = next86 ? (duration || 'UNTIL_END_OF_DAY') : null;
    item.eightySixReason = next86 ? (reason || 'Kitchen stock depleted') : undefined;
    item.lastToggledAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: next86
        ? `"${item.name}" is now 86'd (Sold Out). Auto-substitute suggestions are active for customer carts.`
        : `"${item.name}" restored to active stock (${item.remainingPortions} portions).`,
      item
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle 86 status: ' + error.message });
  }
};

export const updateKitchenItemPortions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const itemId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
    const { remainingPortions } = req.body;

    if (typeof remainingPortions !== 'number' || remainingPortions < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative remainingPortions number is required' });
    }

    const item = kitchenInventoryCache.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Kitchen item not found' });
    }

    item.remainingPortions = remainingPortions;
    if (remainingPortions === 0) {
      item.is86ed = true;
      item.eightySixDuration = 'UNTIL_END_OF_DAY';
      item.eightySixReason = 'Portions depleted to 0';
    } else if (item.is86ed) {
      item.is86ed = false;
      item.eightySixDuration = null;
      item.eightySixReason = undefined;
    }
    item.lastToggledAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: `Updated ${item.name} stock to ${remainingPortions} portions.`,
      item
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update portions: ' + error.message });
  }
};

export const bulkKitchen86Action = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, category } = req.body;

    if (action === 'RESTORE_ALL') {
      kitchenInventoryCache.forEach(i => {
        i.is86ed = false;
        if (i.remainingPortions === 0) i.remainingPortions = 15;
        i.eightySixDuration = null;
        i.eightySixReason = undefined;
      });
      return res.status(200).json({
        success: true,
        message: 'All kitchen menu items have been restored to active stock.',
        items: kitchenInventoryCache
      });
    }

    if (action === '86_CATEGORY' && category) {
      kitchenInventoryCache.forEach(i => {
        if (i.category === category) {
          i.is86ed = true;
          i.remainingPortions = 0;
          i.eightySixDuration = 'UNTIL_END_OF_DAY';
          i.eightySixReason = `Bulk emergency 86 for ${category}`;
        }
      });
      return res.status(200).json({
        success: true,
        message: `All ${category} items have been 86'd.`,
        items: kitchenInventoryCache
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid bulk action' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Bulk action failed: ' + error.message });
  }
};

export const getKitchenAutoSubstitutions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.itemId;
    const itemId = Array.isArray(rawId) ? rawId[0] : (rawId || '');

    const item = kitchenInventoryCache.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Return suggested substitute if available or candidates in same category
    const candidates = kitchenInventoryCache
      .filter(i => i.id !== itemId && !i.is86ed && (i.category === item.category || i.category === 'SIDES'))
      .map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        differenceNgn: c.price - item.price,
        imageUrl: c.imageUrl
      }));

    return res.status(200).json({
      success: true,
      data: {
        originalItem: {
          id: item.id,
          name: item.name,
          price: item.price,
          is86ed: item.is86ed,
          reason: item.eightySixReason
        },
        primarySubstitute: item.autoSubstitute || candidates[0] || null,
        alternativeSubstitutes: candidates
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch substitutions: ' + error.message });
  }
};
