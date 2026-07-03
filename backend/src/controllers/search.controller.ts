import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../../db';
import { products, vendorProfiles } from '../../db/schema';
import { ilike, or } from 'drizzle-orm';

export const unifiedSearch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchTerm = `%${query}%`;

    // 1. Search Products (Food, Groceries, Pharmacy, Retail, Services)
    const matchedProducts = await db.select().from(products)
      .where(or(
        ilike(products.name, searchTerm),
        ilike(products.description, searchTerm),
        ilike(products.category, searchTerm)
      ))
      .limit(10);

    // 2. Search Vendors (Nearby Stores, Pharmacies, Restaurants)
    const matchedVendors = await db.select().from(vendorProfiles)
      .where(or(
        ilike(vendorProfiles.businessName, searchTerm),
        ilike(vendorProfiles.displayName, searchTerm)
      ))
      .limit(5);

    // 3. Format the Unified Response
    const searchResults = {
      query,
      products: matchedProducts,
      vendors: matchedVendors,
      totalMatches: matchedProducts.length + matchedVendors.length
    };

    return res.status(200).json({ success: true, data: searchResults });
  } catch (error) {
    console.error('unifiedSearch Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
