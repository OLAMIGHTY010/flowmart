import { pgTable, uuid, varchar, timestamp, pgEnum, integer, decimal, text, boolean, jsonb } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'super_admin', 
  'admin',
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
  phone: varchar('phone', { length: 50 }),
  dateOfBirth: varchar('date_of_birth', { length: 50 }),
  gender: varchar('gender', { length: 50 }),
  isVerified: boolean('is_verified').default(false).notNull(),
  profileCompleted: boolean('profile_completed').default(false).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active', 'suspended'
  forcePasswordChange: boolean('force_password_change').default(false).notNull(),
  passwordChangedAt: timestamp('password_changed_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(), 
  sku: varchar('sku', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  oldPrice: decimal('old_price', { precision: 10, scale: 2 }),
  stockQuantity: integer('stock_quantity').default(0).notNull(), 
  imageUrl: varchar('image_url', { length: 500 }), 
  images: text('images'), // Comma separated extra image URLs
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  weight: decimal('weight', { precision: 10, scale: 2 }),
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

// --- NEW WELFARE TABLES ---

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

export const vendorProfiles = pgTable('vendor_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  businessName: varchar('business_name', { length: 255 }),
  businessPhone: varchar('business_phone', { length: 50 }).notNull(),
  stateRegion: varchar('state_region', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  bio: text('bio'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorKyc = pgTable('vendor_kyc', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull().unique(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  cacNo: varchar('cac_no', { length: 255 }),
  campCertificateId: varchar('camp_certificate_id', { length: 255 }),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  governmentIdType: varchar('government_id_type', { length: 100 }).notNull(),
  guarantorName: varchar('guarantor_name', { length: 255 }).notNull(),
  guarantorPhone: varchar('guarantor_phone', { length: 50 }).notNull(),
  guarantorRelationship: varchar('guarantor_relationship', { length: 100 }).notNull(),
  governmentIdFile: text('government_id_file'), // Base64 content or filename
  campCertificateFile: text('camp_certificate_file'), // Base64 content or filename
  guarantorIdFile: text('guarantor_id_file'), // Base64 content or filename
  nafdacCertificateCode: varchar('nafdac_certificate_code', { length: 255 }),
  nafdacCertificateFile: text('nafdac_certificate_file'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorKycHistory = pgTable('vendor_kyc_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // e.g. 'submitted', 'approved', 'rejected'
  notes: text('notes'),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const verificationOtps = pgTable('verification_otps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 50 }).notNull(), // e.g. AUT-3047
  actorId: uuid('actor_id').references(() => users.id), // Can be null for system events
  actorName: varchar('actor_name', { length: 255 }).notNull(), // Adebayo Wash, System, etc.
  action: varchar('action', { length: 100 }).notNull(), // Rejected, Updated, Login
  module: varchar('module', { length: 100 }).notNull(), // Onboard, Profile, Auth
  description: text('description').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull(), // Success, Failed
  metadata: jsonb('metadata'), // JSON object for previous/new state
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
