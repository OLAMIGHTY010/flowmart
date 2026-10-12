/**
 * ============================================================================
 * UNIT TESTS: HYBRID VECTOR RAG PIPELINE SERVICE
 * ============================================================================
 */

import { ragPipelineService } from '../../services/ai/rag-pipeline.service';
import { VectorProductCandidate } from '../../services/ai/vector-search.service';

describe('RagPipelineService (Grounded Vector RAG)', () => {
  const verifiedCatalog: VectorProductCandidate[] = [
    {
      id: 'p-bread-1',
      name: 'Fresh Artisan Gluten-Free Sourdough Bread',
      description: 'Baked daily in Ikeja with organic tapioca and rice flour',
      category: 'Bakery',
      price: 3500,
    },
    {
      id: 'p-milk-2',
      name: 'Lactose-Free Almond Milk 1L',
      description: 'Plant-based unsweetened fortified milk',
      category: 'Dairy & Alternatives',
      price: 2800,
    },
    {
      id: 'p-phone-3',
      name: 'iPhone 15 Pro Max 256GB',
      description: 'Titanium design with A17 Pro chip',
      category: 'Phones & Tablets',
      price: 1650000,
    },
  ];

  it('answers queries strictly grounded in retrieved catalog inventory', async () => {
    const res = await ragPipelineService.executeGroundedQuery(
      'Do you have any gluten free bread available?',
      verifiedCatalog
    );

    expect(res.answer).toBeTruthy();
    expect(res.hallucinationChecked).toBe(true);
    expect(res.groundedProducts.length).toBeGreaterThan(0);
    expect(res.groundedProducts[0].name).toContain('Gluten-Free');
    expect(res.groundedProducts[0].price).toBe(3500);
    expect(res.confidenceScore).toBeGreaterThanOrEqual(0.7);
  });

  it('handles empty query gracefully with instruction', async () => {
    const res = await ragPipelineService.executeGroundedQuery('', verifiedCatalog);

    expect(res.groundedProducts.length).toBe(0);
    expect(res.answer).toContain('provide');
  });
});
