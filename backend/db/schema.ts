import { pgTable, uuid, varchar, timestamp, pgEnum, integer, decimal, text, boolean, jsonb, date } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'super_admin', 
  'admin',
  'camp_logistics_coordinator', 
  'zone_coordinator', 
  'vendor', 
  'dispatch_rider', 
  'attendee',
  'finance',
  'auditor',
  'customer_service'
]);

export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer', 'pay_on_delivery', 'paystack', 'flutterwave']);
export const kycStatusEnum = pgEnum('kyc_status', ['unsubmitted', 'pending', 'under_review', 'approved', 'rejected']);
export const authProviderEnum = pgEnum('auth_provider', ['local', 'google']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  
  password: varchar('password', { length: 255 }), // Nullable for Google users
  authProvider: authProviderEnum('auth_provider').default('local').notNull(),
  providerId: varchar('provider_id', { length: 255 }), // Stores Google ID
  
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
  pendingBalance: decimal('pending_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2 }).default('0.00').notNull(),
  vendorCommissionPct: integer('vendor_commission_pct'),
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
  governmentIdFile: text('government_id_file'), 
  campCertificateFile: text('camp_certificate_file'), 
  guarantorIdFile: text('guarantor_id_file'), 
  nafdacCertificateCode: varchar('nafdac_certificate_code', { length: 255 }),
  nafdacCertificateFile: text('nafdac_certificate_file'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vendorKycHistory = pgTable('vendor_kyc_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), 
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
  eventId: varchar('event_id', { length: 50 }).notNull(), 
  actorId: uuid('actor_id').references(() => users.id), 
  actorName: varchar('actor_name', { length: 255 }).notNull(), 
  action: varchar('action', { length: 100 }).notNull(), 
  module: varchar('module', { length: 100 }).notNull(), 
  description: text('description').notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull(), 
  metadata: jsonb('metadata'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const welfareInventory = pgTable('welfare_inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  stock: integer('stock').notNull().default(0),
  allocated: integer('allocated').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(), 
  status: varchar('status', { length: 50 }).notNull(), 
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
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  vehicleType: varchar('vehicle_type', { length: 100 }).notNull(),
  makeModel: varchar('make_model', { length: 255 }).notNull(),
  year: varchar('year', { length: 20 }).notNull(),
  plateNumber: varchar('plate_number', { length: 100 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  insuranceFile: text('insurance_file'),
  roadWorthinessFile: text('road_worthiness_file'),
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

export const globalSettings = pgTable('global_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const deliveryZones = pgTable('delivery_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneName: varchar('zone_name', { length: 255 }).notNull(),
  baseFee: decimal('base_fee', { precision: 10, scale: 2 }).notNull(),
  perKmFee: decimal('per_km_fee', { precision: 10, scale: 2 }).notNull(),
  riderCommissionPct: integer('rider_commission_pct').default(80).notNull(),
  platformCommissionPct: integer('platform_commission_pct').default(20).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  zoneId: uuid('zone_id').references(() => deliveryZones.id),
  ruleType: varchar('rule_type', { length: 100 }).notNull(),
  condition: jsonb('condition').notNull(),
  valueType: varchar('value_type', { length: 50 }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  priority: integer('priority').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderDelivery = pgTable('order_delivery', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id).notNull().unique(),
  distanceKm: decimal('distance_km', { precision: 10, scale: 2 }).notNull(),
  baseFee: decimal('base_fee', { precision: 10, scale: 2 }).notNull(),
  distanceFee: decimal('distance_fee', { precision: 10, scale: 2 }).notNull(),
  ruleAdjustments: jsonb('rule_adjustments').default([]).notNull(),
  riderShare: decimal('rider_share', { precision: 10, scale: 2 }).notNull(),
  platformShare: decimal('platform_share', { precision: 10, scale: 2 }).notNull(),
  finalDeliveryFee: decimal('final_delivery_fee', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['open', 'bot_handling', 'escalated', 'resolved']);

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  agentId: uuid('agent_id').references(() => users.id),
  status: supportTicketStatusEnum('status').default('bot_handling').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const supportMessages = pgTable('support_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id), // Null if sent by the bot
  message: text('message').notNull(),
  isBot: boolean('is_bot').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const staffProfiles = pgTable('staff_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  church: varchar('church', { length: 255 }),
  zonal: varchar('zonal', { length: 255 }),
  department: varchar('department', { length: 255 }),
  professionalCertification: varchar('professional_certification', { length: 255 }),
  grade: varchar('grade', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00').notNull(),
  currency: varchar('currency', { length: 10 }).default('NGN').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, success, failed
  reference: varchar('reference', { length: 255 }).unique(),
  failureReason: text('failure_reason'),
  bankCode: varchar('bank_code', { length: 10 }),
  accountNumber: varchar('account_number', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').references(() => wallets.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'deposit', 'withdrawal', 'payment'
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  reference: varchar('reference', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => users.id).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage', 'fixed'
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minOrderValue: decimal('min_order_value', { precision: 10, scale: 2 }).default('0.00'),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').default(0).notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


