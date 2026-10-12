import { inventoryAutomationService } from '../../services/automation/inventory-automation.service';

describe('InventoryAutomationService', () => {
  beforeEach(() => {
    inventoryAutomationService.clearAll();
  });

  it('should calculate reorder point and flag reorder warning', () => {
    // Daily velocity = 5 units, Lead time = 3 days, Safety stock = 10 units -> ROP = 5*3 + 10 = 25 units
    inventoryAutomationService.registerItem({
      productId: 'prod-inv-01',
      vendorId: 'vendor-inv-01',
      title: 'Gaming Mouse RGB',
      currentStock: 20, // <= ROP of 25
      dailyVelocity: 5,
      leadTimeDays: 3,
      safetyStockUnits: 10,
      currentPriceNgn: 15000,
      minPriceFloorNgn: 12000,
      maxPriceCeilingNgn: 18000,
      autoRepriceEnabled: false,
      status: 'OPTIMAL',
    });

    const report = inventoryAutomationService.evaluateItem('prod-inv-01');
    expect(report.reorderPoint).toBe(25);
    expect(report.status).toBe('REORDER_WARNING');
    expect(report.alertDispatched).toBe(true);
    expect(report.daysOfInventoryRemaining).toBe(4);
  });

  it('should auto de-index zero stock items to prevent unfulfillable orders', () => {
    inventoryAutomationService.registerItem({
      productId: 'prod-inv-02',
      vendorId: 'vendor-inv-01',
      title: 'Limited Edition Hoodie',
      currentStock: 0,
      dailyVelocity: 3,
      leadTimeDays: 5,
      safetyStockUnits: 5,
      currentPriceNgn: 35000,
      minPriceFloorNgn: 30000,
      maxPriceCeilingNgn: 45000,
      autoRepriceEnabled: false,
      status: 'OPTIMAL',
    });

    const report = inventoryAutomationService.evaluateItem('prod-inv-02');
    expect(report.status).toBe('DE_INDEXED');
    expect(report.alertDispatched).toBe(true);
  });

  it('should dynamically adjust price upward for critical stockout if autoRepriceEnabled', () => {
    inventoryAutomationService.registerItem({
      productId: 'prod-inv-03',
      vendorId: 'vendor-inv-01',
      title: 'Mechanical Keyboard',
      currentStock: 2, // < safetyStock 5
      dailyVelocity: 4,
      leadTimeDays: 4,
      safetyStockUnits: 5,
      currentPriceNgn: 50000,
      minPriceFloorNgn: 45000,
      maxPriceCeilingNgn: 60000,
      autoRepriceEnabled: true,
      status: 'OPTIMAL',
    });

    const report = inventoryAutomationService.evaluateItem('prod-inv-03');
    expect(report.status).toBe('CRITICAL_STOCKOUT');
    expect(report.suggestedPriceNgn).toBeGreaterThan(50000);
    expect(report.suggestedPriceNgn).toBeLessThanOrEqual(60000);
  });

  it('should run batch audit and aggregate admin stock health metrics', () => {
    inventoryAutomationService.registerItem({
      productId: 'prod-batch-1',
      vendorId: 'v1',
      title: 'Item 1',
      currentStock: 50,
      dailyVelocity: 1,
      leadTimeDays: 2,
      safetyStockUnits: 5,
      currentPriceNgn: 10000,
      minPriceFloorNgn: 8000,
      maxPriceCeilingNgn: 12000,
      autoRepriceEnabled: false,
      status: 'OPTIMAL',
    });

    const batch = inventoryAutomationService.runBatchInventoryAudit();
    expect(batch.evaluatedCount).toBe(1);

    const metrics = inventoryAutomationService.getAdminInventoryMetrics();
    expect(metrics.stockHealthRatePercent).toBe(100);
  });
});
