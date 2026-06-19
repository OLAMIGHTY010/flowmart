import { pgTable, uuid, varchar, timestamp, pgEnum, integer, decimal, text, boolean, jsonb, date } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'super_admin', 
  'admin',
  'camp_logistics_coordinator', 
  'zone_coordinator', 
  'vendor', 
  'dispatch_rider', 
  'attendee'
]);

export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer', 'pay_on_delivery']);
export const kycStatusEnum = pgEnum('kyc_status', ['unsubmitted', 'pending', 'under_review', 'approved', 'rejected']);

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
  
  otp: varchar('otp', { length: 255 }),
  otpExpiry: timestamp('otp_expiry'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry'),

  // User Profile Extensions
  avatar: varchar('avatar', { length: 500 }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  privacySettings: jsonb('privacy_settings').default({ profileVisibility: true, showOnlineStatus: true, locationTracking: false }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});



export const kycSubmissions = pgTable('kyc_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull().unique(),
  status: kycStatusEnum('status').default('unsubmitted').notNull(),
  referenceId: varchar('reference_id', { length: 100 }).unique(),
  
  governmentIdType: varchar('government_id_type', { length: 50 }),
  guarantorName: varchar('guarantor_name', { length: 255 }),
  guarantorPhone: varchar('guarantor_phone', { length: 50 }),
  guarantorRelationship: varchar('guarantor_relationship', { length: 100 }),
  
  governmentIdUrl: varchar('government_id_url', { length: 500 }),
  campCertificateUrl: varchar('camp_certificate_url', { length: 500 }),
  
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
  
  // Extended Product Metadata
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  images: jsonb('images').default([]), 
  
  stockQuantity: integer('stock_quantity').default(0).notNull(),
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
  orderRef: varchar('order_ref', { length: 50 }).notNull().unique(), 
  attendeeId: uuid('attendee_id').references(() => users.id).notNull(), 
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),     
  riderId: uuid('rider_id').references(() => users.id),                 
  deliveryZone: varchar('delivery_zone', { length: 100 }).notNull(),    
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Payment Information
  paymentMethod: paymentMethodEnum('payment_method').default('pay_on_delivery').notNull(),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  paymentProofUrl: varchar('payment_proof_url', { length: 500 }),
  
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
  deliveryRef: varchar('delivery_ref', { length: 50 }).unique(), 
  eventId: uuid('event_id').references(() => welfareEvents.id).notNull(),
  zoneId: varchar('zone_id', { length: 100 }).notNull(),
  riderId: uuid('rider_id').references(() => users.id),
  totalItems: integer('total_items').notNull(),
  distributedItems: integer('distributed_items').default(0).notNull(),
  shortageReported: integer('shortage_reported').default(0).notNull(),
  shortageDescription: text('shortage_description'), 
  shortageReportedAt: timestamp('shortage_reported_at'),
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

export const welfareInventory = pgTable('welfare_inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  stock: integer('stock').notNull().default(0),
  allocated: integer('allocated').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(), // 'packs', 'liters', 'bottles', etc.
  status: varchar('status', { length: 50 }).notNull(), // 'Sufficient', 'Shortage Risk'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
export const riderProfiles = pgTable('rider_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  riderId: uuid('rider_id').references(() => users.id).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  stateRegion: varchar('state_region', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  bio: text('bio'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riderKyc = pgTable('rider_kyc', {
  id: uuid('id').defaultRandom().primaryKey(),
  riderId: uuid('rider_id').references(() => users.id).notNull().unique(),
  
  // Bank Details
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  
  // Vehicle Details
  vehicleType: varchar('vehicle_type', { length: 100 }).notNull(),
  makeModel: varchar('make_model', { length: 255 }).notNull(),
  year: varchar('year', { length: 20 }).notNull(),
  plateNumber: varchar('plate_number', { length: 100 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  
  // Document URLs
  insuranceFile: text('insurance_file'),
  roadWorthinessFile: text('road_worthiness_file'),
  
  // Guarantor and Govt ID
  governmentIdType: varchar('government_id_type', { length: 100 }).notNull(),
  guarantorName: varchar('guarantor_name', { length: 255 }).notNull(),
  guarantorPhone: varchar('guarantor_phone', { length: 50 }).notNull(),
  guarantorRelationship: varchar('guarantor_relationship', { length: 100 }).notNull(),
  
  governmentIdFile: text('government_id_file'),
  guarantorIdFile: text('guarantor_id_file'),
  carImageFile: text('car_image_file'),
  riderImageFile: text('rider_image_file'),
  
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
