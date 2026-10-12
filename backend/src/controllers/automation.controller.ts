/**
 * ============================================================================
 * CENTRAL AUTOMATION CONTROLLER (VENDOR, RIDER, USER & ADMIN)
 * ============================================================================
 *
 * Exposes all 7 automation engines via structured REST endpoints:
 * - Vendor: Restock alerts, cart recovery stats, rolling reserves.
 * - Rider: Active dispatch countdown offers, accept/decline response.
 * - User: Instant micro-dispute resolution, FX currency convert, diaspora quotes.
 * - Admin: Unified automation control plane, heartbeats, quarantine overrides.
 *
 * @module backend/src/controllers/automation.controller
 */

import { Request, Response } from 'express';
import {
  logisticsAutomationService,
  disputeAutomationService,
  marketingAutomationService,
  inventoryAutomationService,
  fraudAutomationService,
  fxAutomationService,
  payoutAutomationService,
  runAutonomousHeartbeat,
  SupportedCurrency,
} from '../services/automation';

export class AutomationController {
  // ==========================================
  // VENDOR ENDPOINTS
  // ==========================================

  public static async getVendorInventoryAlerts(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user?.id || req.query.vendorId as string || 'default-vendor';
      const alerts = inventoryAutomationService.getVendorInventoryAlerts(vendorId);
      res.json({ success: true, alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getVendorPayoutStatement(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user?.id || req.query.vendorId as string || 'default-vendor';
      const statement = payoutAutomationService.getVendorPayoutStatement(vendorId);
      res.json({ success: true, statement });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getVendorCartRecovery(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user?.id || req.query.vendorId as string || 'default-vendor';
      const metrics = marketingAutomationService.getVendorCartRecoveryMetrics(vendorId);
      res.json({ success: true, metrics });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // RIDER ENDPOINTS
  // ==========================================

  public static async getRiderActiveOffer(req: Request, res: Response) {
    try {
      const riderId = (req as any).user?.id || req.query.riderId as string || 'rider-lagos-01';
      const offer = logisticsAutomationService.getActiveOfferForRider(riderId);
      res.json({ success: true, offer });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async handleRiderOfferResponse(req: Request, res: Response) {
    try {
      const { dispatchId, riderId, response } = req.body;
      if (!dispatchId || !riderId || !response) {
        return res.status(400).json({
          success: false,
          message: 'Missing dispatchId, riderId, or response (ACCEPT | DECLINE)',
        });
      }

      const result = logisticsAutomationService.handleRiderResponse(
        dispatchId,
        riderId,
        response as 'ACCEPT' | 'DECLINE'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // USER / BUYER ENDPOINTS
  // ==========================================

  public static async arbitrateUserDispute(req: Request, res: Response) {
    try {
      const {
        disputeId,
        orderId,
        buyerId,
        buyerTrustScore,
        buyerLifetimeDisputes,
        vendorId,
        riderId,
        claimAmountNgn,
        claimReason,
        evidencePhotos,
        podPhotoUrl,
        riderDeliveryGpsDistanceMeters,
      } = req.body;

      if (!disputeId || !orderId || !claimAmountNgn || !claimReason) {
        return res.status(400).json({
          success: false,
          message: 'Missing required dispute fields: disputeId, orderId, claimAmountNgn, claimReason',
        });
      }

      const result = disputeAutomationService.arbitrateDispute({
        disputeId,
        orderId,
        buyerId: buyerId || (req as any).user?.id || 'buyer-1',
        buyerTrustScore: buyerTrustScore ?? 0.9,
        buyerLifetimeDisputes: buyerLifetimeDisputes ?? 0,
        vendorId: vendorId || 'vendor-1',
        riderId: riderId || 'rider-1',
        claimAmountNgn,
        claimReason,
        evidencePhotos: evidencePhotos || [],
        podPhotoUrl,
        riderDeliveryGpsDistanceMeters,
      });

      res.json({ success: true, resolution: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async convertCurrency(req: Request, res: Response) {
    try {
      const { amount, from, to } = req.body;
      if (amount === undefined || !from || !to) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, from, to',
        });
      }

      const conversion = fxAutomationService.convertCurrency(
        Number(amount),
        from as SupportedCurrency,
        to as SupportedCurrency
      );

      res.json({ success: true, conversion });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getDiasporaQuote(req: Request, res: Response) {
    try {
      const { cartTotalNgn, buyerCurrency, recipientCity, recipientCountry, giftMessage } = req.body;
      if (!cartTotalNgn || !buyerCurrency || !recipientCity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: cartTotalNgn, buyerCurrency, recipientCity',
        });
      }

      const quote = fxAutomationService.createDiasporaGiftingQuote(
        Number(cartTotalNgn),
        buyerCurrency as SupportedCurrency,
        recipientCity,
        recipientCountry,
        giftMessage
      );

      res.json({ success: true, quote });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // ADMIN CONTROL PLANE ENDPOINTS
  // ==========================================

  public static async getAdminDashboard(req: Request, res: Response) {
    try {
      const logistics = logisticsAutomationService.getAdminLogisticsMetrics();
      const disputes = disputeAutomationService.getAdminDisputeSummary();
      const marketing = marketingAutomationService.getAdminMarketingMetrics();
      const inventory = inventoryAutomationService.getAdminInventoryMetrics();
      const fraud = fraudAutomationService.getAdminFraudMetrics();
      const payouts = payoutAutomationService.getAdminPayoutSummary();
      const rates = fxAutomationService.getRatesTable();

      res.json({
        success: true,
        metrics: {
          logistics,
          disputes,
          marketing,
          inventory,
          fraud,
          payouts,
          rates,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async triggerAutonomousHeartbeat(req: Request, res: Response) {
    try {
      const heartbeat = runAutonomousHeartbeat();
      res.json({ success: true, heartbeat });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async liftFraudQuarantine(req: Request, res: Response) {
    try {
      const { entity } = req.body;
      if (!entity) {
        return res.status(400).json({ success: false, message: 'Entity is required' });
      }
      const lifted = fraudAutomationService.liftQuarantine(entity);
      res.json({ success: true, lifted });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async setMicroDisputeThreshold(req: Request, res: Response) {
    try {
      const { thresholdNgn } = req.body;
      if (thresholdNgn === undefined || Number(thresholdNgn) < 0) {
        return res.status(400).json({ success: false, message: 'Valid thresholdNgn is required' });
      }
      disputeAutomationService.setMicroThreshold(Number(thresholdNgn));
      res.json({
        success: true,
        newThresholdNgn: disputeAutomationService.getMicroThreshold(),
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async syncExchangeRates(req: Request, res: Response) {
    try {
      const { rates } = req.body;
      const updated = fxAutomationService.syncExchangeRates(rates);
      res.json({ success: true, rates: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
