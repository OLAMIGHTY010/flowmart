import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import {
  getDashboardStats,
  getDeliveryMetricsChart,
  getCriticalAlerts,
  getRecentActivity,
  getPlatformHealth
} from '../controllers/admin.controller';

import {
  getVendorApprovalStats,
  getVendorsList,
  getVendorDetails,
  reviewVendor
} from '../controllers/admin-vendor.controller';

import {
  getRiderStats,
  getRidersList
} from '../controllers/admin-rider.controller';

import {
  getPlatformOverview,
  getDeliveryTrends,
  getVendorPerformance,
  exportAnalytics,
  getCoordinatorOverview,
  getCoordinatorDeliveryTrends,
  getZonePerformance,
  getRiderEfficiencyDist,
  getEventMetricsSummary,
  getShortageIncidents
} from '../controllers/analytics.controller';

import {
  getAuditLogs,
  exportAuditLogs
} from '../controllers/audit-logs.controller';

const router = Router();

// Apply auth middleware to all admin routes.
// We'll optionally require 'admin' role, but for now we'll just check JWT
router.use(authenticateJWT);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/health', getPlatformHealth);
router.get('/dashboard/chart', getDeliveryMetricsChart);
router.get('/dashboard/alerts', getCriticalAlerts);
router.get('/dashboard/activity', getRecentActivity);

// Vendor Approval routes
router.get('/vendors/stats', getVendorApprovalStats);
router.get('/vendors', getVendorsList);
router.get('/vendors/:id', getVendorDetails);
router.post('/vendors/:id/review', reviewVendor);

// Rider Management routes
router.get('/riders/stats', getRiderStats);
router.get('/riders', getRidersList);

// Audit Logs
router.get('/audit-logs', getAuditLogs);
router.get('/audit-logs/export', exportAuditLogs);

// Analytics (Admins/Super Admins)
router.use('/analytics', authorizeRoles('super_admin', 'admin'));
router.get('/analytics/overview', getPlatformOverview);
router.get('/analytics/delivery-trends', getDeliveryTrends);
router.get('/analytics/vendor-performance', getVendorPerformance);
router.get('/analytics/zone-performance', getZonePerformance);
router.get('/analytics/export', exportAnalytics);

// Coordinator Analytics (Zone and Camp Logistics Coordinators)
router.use('/coordinator-analytics', authorizeRoles('zone_coordinator', 'camp_logistics_coordinator'));
router.get('/coordinator-analytics/overview', getCoordinatorOverview);
router.get('/coordinator-analytics/delivery-trends', getCoordinatorDeliveryTrends);
router.get('/coordinator-analytics/zone-performance', getZonePerformance);
router.get('/coordinator-analytics/rider-efficiency', getRiderEfficiencyDist);
router.get('/coordinator-analytics/event-metrics', getEventMetricsSummary);
router.get('/coordinator-analytics/shortage-incidents', getShortageIncidents);

export default router;
