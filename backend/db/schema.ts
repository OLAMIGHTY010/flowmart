import { pgTable, uuid, varchar, timestamp, pgEnum,integer, decimal, text } from 'drizzle-orm/pg-core';

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
  password: varchar('password', { length: 255 }).notNull(), // Will store the bcrypt hash
  role: roleEnum('role').default('attendee').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(), // Links to the vendor who owns it
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(), // Crucial for your Inventory Logic
  imageUrl: varchar('image_url', { length: 500 }), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


// --- 2. ORDER TABLES ---

export const orderStatusEnum = pgEnum('order_status', [
  'pending',    // Order placed, waiting for vendor confirmation
  'confirmed',  // Vendor confirmed, waiting for rider
  'assigned',   // Rider assigned
  'picked_up',  // Rider picked up from vendor
  'delivered',  // Attendee received it
  'cancelled'
]);

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  attendeeId: uuid('attendee_id').references(() => users.id).notNull(), // Who ordered it
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),     // Who is selling it
  riderId: uuid('rider_id').references(() => users.id),                 // Who is delivering it (assigned later)
  deliveryZone: varchar('delivery_zone', { length: 100 }).notNull(),    // e.g., "Zone 4, Parish A"
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryPin: varchar('delivery_pin', { length: 6 }),                  // For rider delivery confirmation
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
