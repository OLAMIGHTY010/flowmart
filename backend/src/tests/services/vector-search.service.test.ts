/**
 * ============================================================================
 * UNIT TESTS: PGVECTOR & DENSE SEMANTIC VECTOR SEARCH
 * ============================================================================
 */

import { vectorSearchService, VectorProductCandidate } from '../../services/ai/vector-search.service';

describe('VectorSearchService (pgvector & Semantic Engine)', () => {
  const sampleCatalog: VectorProductCandidate[] = [
    {
      id: 'p1',
      name: 'Men White Running Sneakers',
      description: 'Breathable sports shoes with cushioned athletic sole',
      category: 'Footwear',
      price: 25000,
    },
    {
      id: 'p2',
      name: 'Organic Raw Wild Honey',
      description: 'Pure natural unprocessed amber honey from local farm',
      category: 'Groceries',
      price: 5500,
    },
    {
      id: 'p3',
      name: 'Linen Lightweight Summer Button-Up Shirt',
      description: 'Cool casual breathable linen fabric for warm humid weather',
      category: 'Clothing',
      price: 18000,
    },
    {
      id: 'p4',
      name: 'Noise Cancelling Wireless Bluetooth Headphones',
      description: 'Over-ear studio audio with 30-hour battery life and deep bass',
      category: 'Electronics',
      price: 45000,
    },
  ];

  describe('1. Vector Embedding Generator', () => {
    it('generates normalized dense vectors with correct dimensions', () => {
      const vec = vectorSearchService.generateEmbedding('wireless headphones');
      expect(vec.length).toBe(64);
      // L2 magnitude check: sum(v^2) should be approximately 1
      const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      expect(mag).toBeCloseTo(1, 1);
    });
  });

  describe('2. Cosine Similarity Calculation', () => {
    it('returns high similarity for identical and semantically close vectors', () => {
      const v1 = vectorSearchService.generateEmbedding('running sports sneakers');
      const v2 = vectorSearchService.generateEmbedding('running sports sneakers');
      const sim = vectorSearchService.cosineSimilarity(v1, v2);
      expect(sim).toBeGreaterThanOrEqual(0.95);
    });

    it('returns lower similarity for completely unrelated concepts', () => {
      const vFootwear = vectorSearchService.generateEmbedding('sneakers');
      const vHoney = vectorSearchService.generateEmbedding('raw wild honey groceries');
      const sim = vectorSearchService.cosineSimilarity(vFootwear, vHoney);
      expect(sim).toBeLessThan(0.7);
    });
  });

  describe('3. Semantic Discovery Matching', () => {
    it('ranks relevant footwear at top when searching for athletic shoes', () => {
      const results = vectorSearchService.searchBySemanticQuery('running athletic shoes', sampleCatalog, 2);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('p1');
      expect(results[0].similarityScore).toBeGreaterThan(0.2);
    });

    it('matches visual style and material attributes', () => {
      const results = vectorSearchService.searchByVisualAttributes(
        { style: 'casual', material: 'linen' },
        sampleCatalog,
        2
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('p3');
    });
  });
});
