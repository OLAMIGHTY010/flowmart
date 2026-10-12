/**
 * ============================================================================
 * UNIT TESTS: SEARCH CONTROLLER (UNIFIED SEMANTIC SEARCH)
 * ============================================================================
 */

import { unifiedSearch } from '../../controllers/search.controller';

jest.mock('../../services/ai/semantic-search.service', () => ({
  executeSemanticSearch: jest.fn().mockImplementation((query: string) => {
    return Promise.resolve({
      query,
      products: [{ id: 'p-1', name: `Product for ${query}` }],
      vendors: [{ id: 'v-1', businessName: `Vendor for ${query}` }],
      totalMatches: 2,
      parsedIntent: {
        rawQuery: query,
        keywords: [query],
        detectedIntent: 'product_search',
      },
      relaxedQueryApplied: false,
    });
  }),
}));

function createMockReq(queryParam?: any) {
  return {
    query: queryParam !== undefined ? { query: queryParam } : {},
    user: { id: 'u-1', role: 'customer' },
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Search Controller - unifiedSearch', () => {
  it('returns 400 if search query is missing', async () => {
    const req = createMockReq(undefined);
    const res = createMockRes();

    await unifiedSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Search query is required' })
    );
  });

  it('returns 200 with semantic results and intent when query is valid', async () => {
    const req = createMockReq('healthy groceries');
    const res = createMockRes();

    await unifiedSearch(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          query: 'healthy groceries',
          products: expect.any(Array),
          vendors: expect.any(Array),
          totalMatches: 2,
          parsedIntent: expect.any(Object),
        }),
      })
    );
  });
});
