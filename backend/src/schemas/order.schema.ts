import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required').optional(),
  productId: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  deliveryZone: z.string().optional(),
  zone: z.string().optional(),
  deliveryPostcode: z.string().optional(),
  deliveryAddress: z.string().optional(),
  addressSource: z.enum(['postcode', 'manual']).optional(),
  phone: z.string().optional(),
  tipAmount: z.number().nonnegative().optional(),
  dropoffOption: z.string().optional(),
  deliveryNotes: z.string().optional(),
  addressTag: z.string().optional(),
  payment_method: z.enum(['paystack', 'escrow', 'wallet', 'pay_on_delivery']).optional(),
}).refine(data => data.items || (data.productId && data.quantity), {
  message: 'Order must contain either items array or a productId/quantity pair',
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'in_transit', 'delivered', 'cancelled', 'disputed']),
  riderId: z.string().optional(),
});

export const calculateDeliverySchema = z.object({
  zone: z.string().optional(),
  postcode: z.string().optional(),
  distanceKm: z.number().nonnegative().optional(),
}).refine(data => !!(data.zone || data.postcode), {
  message: 'Either zone or postcode must be provided',
});
