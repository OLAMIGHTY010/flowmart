import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { executeSemanticSearch } from '../services/ai/semantic-search.service';

export const unifiedSearch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const semanticResult = await executeSemanticSearch(query, 12);

    const searchResults = {
      query,
      products: semanticResult.products,
      vendors: semanticResult.vendors,
      totalMatches: semanticResult.totalMatches,
      parsedIntent: semanticResult.parsedIntent,
      relaxedQueryApplied: semanticResult.relaxedQueryApplied,
    };

    return res.status(200).json({ success: true, data: searchResults });
  } catch (error) {
    console.error('unifiedSearch Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
