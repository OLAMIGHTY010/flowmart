import { Router } from "express";
import { 
  updateProfile, 
  submitKYC, 
  getKYCStatus, 
  getVendorStats, 
  getKitchenRushStatus, 
  updateKitchenRushStatus, 
  getOrderThermalTicket, 
  toggleProduct86,
  getKdsTickets,
  updateKdsTicketStatus,
  addKdsTicketDelay,
  toggleKdsTicketItem,
  getMerchantFinancialStatements,
  getMerchantPayoutSchedule,
  requestInstantPayout,
  updateMerchantBankSettings
} from "../controllers/vendor.controller";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Apply JWT authentication and verify vendor role for all routes
router.use(authenticateJWT);
router.use(authorizeRoles("vendor", "super_admin"));

router.put("/profile", updateProfile);
router.post("/kyc/submit", submitKYC);
router.get("/kyc/status", getKYCStatus);
router.get("/dashboard/stats", getVendorStats);

// Platform C: Kitchen Merchant Experience Endpoints
router.get("/kitchen/rush-status", getKitchenRushStatus);
router.post("/kitchen/rush-status", updateKitchenRushStatus);
router.get("/orders/:id/thermal-ticket", getOrderThermalTicket);
router.post("/products/:id/toggle-86", toggleProduct86);

// Sprint G: Kitchen Display System (KDS) Endpoints
router.get("/kds/tickets", getKdsTickets);
router.post("/kds/tickets/:id/status", updateKdsTicketStatus);
router.post("/kds/tickets/:id/delay", addKdsTicketDelay);
router.post("/kds/tickets/:id/item-toggle", toggleKdsTicketItem);

// Sprint J: Kitchen Merchant Financial Statements & Automated Weekly Payouts
router.get("/financials/statements", getMerchantFinancialStatements);
router.get("/financials/payout-schedule", getMerchantPayoutSchedule);
router.post("/financials/request-instant-payout", requestInstantPayout);
router.post("/financials/bank-settings", updateMerchantBankSettings);

export default router;
