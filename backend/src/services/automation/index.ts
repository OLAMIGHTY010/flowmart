/**
 * ============================================================================
 * UNIFIED AUTOMATION SUITE EXPORTS & MASTER AUTONOMOUS ORCHESTRATOR
 * ============================================================================
 *
 * Coordinates FlowMart's 7 core automation engines:
 * 1. Logistics Dispatch & Cascade (logisticsAutomationService)
 * 2. Instant Micro-Dispute Arbitration (disputeAutomationService)
 * 3. Abandoned Cart Recovery & Churn Drips (marketingAutomationService)
 * 4. Autonomous Inventory Reorder & De-Indexing (inventoryAutomationService)
 * 5. Anti-Fraud Velocity Quarantine & Sybil Defense (fraudAutomationService)
 * 6. Real-Time FX Exchange Rate Sync (fxAutomationService)
 * 7. Payout Sweep & Rolling Reserves (payoutAutomationService)
 *
 * @module backend/src/services/automation
 */

export * from './logistics-automation.service';
export * from './dispute-automation.service';
export * from './marketing-automation.service';
export * from './inventory-automation.service';
export * from './fraud-automation.service';
export * from './fx-automation.service';
export * from './payout-automation.service';

import { logisticsAutomationService } from './logistics-automation.service';
import { marketingAutomationService } from './marketing-automation.service';
import { inventoryAutomationService } from './inventory-automation.service';
import { payoutAutomationService } from './payout-automation.service';

export interface AutonomousHeartbeatResult {
  cascadesProcessed: number;
  cartDripsProcessed: { stage1Sent: number; stage2Sent: number; expired: number };
  inventoryAudited: { evaluatedCount: number; reorderWarnings: number; criticalStockouts: number; deIndexed: number };
  payoutsSwept: { sweptCount: number; totalAmountNgn: number };
  reservesSwept: { releasedCount: number; totalReleasedNgn: number };
  heartbeatAt: number;
}

/**
 * Executes a single platform-wide autonomous cycle
 */
export function runAutonomousHeartbeat(): AutonomousHeartbeatResult {
  const cascades = logisticsAutomationService.tickCascadeEvaluator();
  const cartDrips = marketingAutomationService.processAbandonedCartDrips();
  const inventory = inventoryAutomationService.runBatchInventoryAudit();
  const payouts = payoutAutomationService.processInspectionPayoutSweep();
  const reserves = payoutAutomationService.processRollingReserveSweep();

  return {
    cascadesProcessed: cascades,
    cartDripsProcessed: cartDrips,
    inventoryAudited: inventory,
    payoutsSwept: payouts,
    reservesSwept: reserves,
    heartbeatAt: Date.now(),
  };
}
