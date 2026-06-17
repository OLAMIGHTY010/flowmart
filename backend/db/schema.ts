import { pgTable, uuid, varchar, timestamp, pgEnum, integer, decimal, text, boolean } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'super_admin', 
  'camp_logistics_coordinator', 
  'zone_coordinator', 
  'vendor', 
  'dispatch_rider', 
  'attendee'
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), 
  role: roleEnum('role').default('attendee').notNull(),
  
  // --- NEW AUTH & SECURITY COLUMNS ---
  isVerified: boolean('is_verified').default(false).notNull(),
  otp: varchar('otp', { length: 255 }),
  otpExpiry: timestamp('otp_expiry'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  // -----------------------------------

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(), 
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(), 
  imageUrl: varchar('image_url', { length: 500 }), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderStatusEnum = pgEnum('order_status', [
  'pending',    
  'confirmed',  
  'assigned',   
  'picked_up',  
  'delivered',  
  'cancelled'
]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderRef: varchar('order_ref', { length: 50 }).notNull().unique(), // ✨ NEW: Standardized Reference FLW-YYYYMMDD-XXXX
  attendeeId: uuid('attendee_id').references(() => users.id).notNull(), 
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),     
  riderId: uuid('rider_id').references(() => users.id),                 
  deliveryZone: varchar('delivery_zone', { length: 100 }).notNull(),    
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryPin: varchar('delivery_pin', { length: 6 }),                  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
});

// --- WELFARE TABLES ---

export const welfareEvents = pgTable('welfare_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const welfareAllocations = pgTable('welfare_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => welfareEvents.id).notNull(),
  zoneId: varchar('zone_id', { length: 100 }).notNull(),
  totalItems: integer('total_items').notNull(),
  distributedItems: integer('distributed_items').default(0).notNull(),
  shortageReported: integer('shortage_reported').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
