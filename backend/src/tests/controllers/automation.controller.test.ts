import { Request, Response } from 'express';
import { AutomationController } from '../../controllers/automation.controller';
import {
  logisticsAutomationService,
  disputeAutomationService,
  inventoryAutomationService,
  payoutAutomationService,
  marketingAutomationService,
} from '../../services/automation';

describe('AutomationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;
  let responseStatus: number;

  beforeEach(() => {
    responseData = null;
    responseStatus = 200;
    mockResponse = {
      status: jest.fn().mockImplementation((code: number) => {
        responseStatus = code;
        return mockResponse;
      }),
      json: jest.fn().mockImplementation((data: any) => {
        responseData = data;
        return mockResponse;
      }),
    };
  });

  describe('Vendor Endpoints', () => {
    it('getVendorInventoryAlerts should return alerts array', async () => {
      mockRequest = { query: { vendorId: 'v-test-1' } };
      await AutomationController.getVendorInventoryAlerts(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.alerts)).toBe(true);
    });

    it('getVendorPayoutStatement should return statement', async () => {
      mockRequest = { query: { vendorId: 'v-test-2' } };
      await AutomationController.getVendorPayoutStatement(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.statement).toBeDefined();
    });

    it('getVendorCartRecovery should return cart recovery metrics', async () => {
      mockRequest = { query: { vendorId: 'v-test-3' } };
      await AutomationController.getVendorCartRecovery(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.metrics.potentialValueNgn).toBeDefined();
    });
  });

  describe('Rider Endpoints', () => {
    it('getRiderActiveOffer should return offer status', async () => {
      mockRequest = { query: { riderId: 'rider-lagos-01' } };
      await AutomationController.getRiderActiveOffer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.offer.hasOffer).toBeDefined();
    });

    it('handleRiderOfferResponse should return 400 for missing fields', async () => {
      mockRequest = { body: { dispatchId: 'disp-1' } }; // missing riderId & response
      await AutomationController.handleRiderOfferResponse(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseStatus).toBe(400);
      expect(responseData.success).toBe(false);
    });
  });

  describe('User / Buyer Endpoints', () => {
    it('arbitrateUserDispute should auto-arbitrate valid dispute request', async () => {
      mockRequest = {
        body: {
          disputeId: 'disp-ctrl-01',
          orderId: 'order-ctrl-01',
          buyerId: 'buyer-ctrl-01',
          claimAmountNgn: 4000,
          claimReason: 'DAMAGED_PACKAGE',
          buyerTrustScore: 0.95,
          buyerLifetimeDisputes: 0,
        },
      };

      await AutomationController.arbitrateUserDispute(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.resolution.resolutionType).toBe('AUTO_RESOLVED_MICRO');
    });

    it('convertCurrency should perform FX conversion', async () => {
      mockRequest = {
        body: { amount: 320000, from: 'NGN', to: 'USD' },
      };

      await AutomationController.convertCurrency(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.conversion.convertedAmount).toBeGreaterThan(0);
    });

    it('getDiasporaQuote should create diaspora gifting quote', async () => {
      mockRequest = {
        body: {
          cartTotalNgn: 150000,
          buyerCurrency: 'GBP',
          recipientCity: 'Lagos',
          recipientCountry: 'Nigeria',
          giftMessage: 'With Love',
        },
      };

      await AutomationController.getDiasporaQuote(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.quote.isDiasporaOrder).toBe(true);
      expect(responseData.quote.targetCurrency).toBe('GBP');
    });
  });

  describe('Admin Control Plane Endpoints', () => {
    it('getAdminDashboard should return aggregate metrics across all 7 engines', async () => {
      mockRequest = {};
      await AutomationController.getAdminDashboard(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.metrics.logistics).toBeDefined();
      expect(responseData.metrics.disputes).toBeDefined();
      expect(responseData.metrics.marketing).toBeDefined();
      expect(responseData.metrics.inventory).toBeDefined();
      expect(responseData.metrics.fraud).toBeDefined();
      expect(responseData.metrics.payouts).toBeDefined();
      expect(responseData.metrics.rates).toBeDefined();
    });

    it('triggerAutonomousHeartbeat should return cycle summary', async () => {
      mockRequest = {};
      await AutomationController.triggerAutonomousHeartbeat(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.heartbeat.heartbeatAt).toBeDefined();
    });

    it('setMicroDisputeThreshold should update micro-resolution threshold', async () => {
      mockRequest = { body: { thresholdNgn: 7500 } };
      await AutomationController.setMicroDisputeThreshold(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(responseData.success).toBe(true);
      expect(responseData.newThresholdNgn).toBe(7500);
    });
  });
});
