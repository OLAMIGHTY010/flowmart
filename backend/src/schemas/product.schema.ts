import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  price: z.union([z.number().positive('Price must be positive'), z.string()]),
  description: z.string().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  oldPrice: z.union([z.number(), z.string()]).optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  images: z.array(z.string()).optional(),
  productType: z.enum(['standard', 'food', 'digital', 'service']).optional(),
  preparationTime: z.number().optional(),
  modifiers: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  dietaryTags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();
