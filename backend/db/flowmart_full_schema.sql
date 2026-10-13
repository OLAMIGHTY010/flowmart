-- ============================================================================
-- FLOWMART COMPLETE DATABASE DDL SCHEMA (PostgreSQL)
-- ============================================================================
-- Complete schema definition for FlowMart e-commerce and logistics platform.
-- Contains all 10 Enum types, 41 Tables, Constraints, and Performance Indexes.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE "auth_provider" AS ENUM ('local', 'google');

CREATE TYPE "role" AS ENUM (
  'super_admin', 
  'admin', 
  'logistics_manager', 
  'regional_manager', 
  'regional_coordinator', 
  'area_manager', 
  'vendor', 
  'dispatch_rider', 
  'user', 
  'customer', 
  'finance', 
  'auditor', 
  'customer_service',
  'corporate_buyer',
  'fleet_manager'
);

CREATE TYPE "kyc_status" AS ENUM ('unsubmitted', 'pending', 'under_review', 'approved', 'rejected');
CREATE TYPE "payment_method" AS ENUM ('bank_transfer', 'pay_on_delivery', 'paystack', 'flutterwave');
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'assigned', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE "product_type" AS ENUM ('food', 'retail', 'grocery', 'service', 'pharmacy', 'real_estate', 'vehicle');
CREATE TYPE "product_condition" AS ENUM ('new', 'used_like_new', 'used_good', 'used_fair');
CREATE TYPE "support_ticket_status" AS ENUM ('open', 'bot_handling', 'escalated', 'resolved');
CREATE TYPE "dispute_status" AS ENUM ('open', 'under_review', 'resolved_buyer_refunded', 'resolved_vendor_paid');
CREATE TYPE "offer_status" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- 3. CORE USER & ACCESS TABLES
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "full_name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255),
  "auth_provider" "auth_provider" DEFAULT 'local' NOT NULL,
  "provider_id" VARCHAR(255),
  "role" "role" DEFAULT 'user' NOT NULL,
  "phone" VARCHAR(50),
  "date_of_birth" VARCHAR(50),
  "gender" VARCHAR(50),
  "is_verified" BOOLEAN DEFAULT false NOT NULL,
  "profile_completed" BOOLEAN DEFAULT false NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "force_password_change" BOOLEAN DEFAULT false NOT NULL,
  "password_changed_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "last_login" TIMESTAMP,
  "referral_code" VARCHAR(20) UNIQUE,
  "referred_by_id" UUID REFERENCES "users"("id"),
  "registration_ip" VARCHAR(50),
  "device_fingerprint" VARCHAR(255),
  "otp" VARCHAR(255),
  "otp_expiry" TIMESTAMP,
  "reset_token" VARCHAR(255),
  "reset_token_expiry" TIMESTAMP,
  "avatar" VARCHAR(500),
  "two_factor_enabled" BOOLEAN DEFAULT false NOT NULL,
  "privacy_settings" JSONB DEFAULT '{"profileVisibility": true, "showOnlineStatus": true, "locationTracking": false}'::jsonb,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Categories
CREATE TABLE IF NOT EXISTS "categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "parent_id" UUID REFERENCES "categories"("id"),
  "icon_url" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Global Settings
CREATE TABLE IF NOT EXISTS "global_settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(100) NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Delivery Zones & Pricing
CREATE TABLE IF NOT EXISTS "delivery_zones" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "zone_name" VARCHAR(255) NOT NULL,
  "base_fee" DECIMAL(10, 2) NOT NULL,
  "per_km_fee" DECIMAL(10, 2) NOT NULL,
  "rider_commission_pct" INTEGER DEFAULT 80 NOT NULL,
  "platform_commission_pct" INTEGER DEFAULT 20 NOT NULL,
  "active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pricing_rules" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "zone_id" UUID REFERENCES "delivery_zones"("id"),
  "rule_type" VARCHAR(50) NOT NULL,
  "condition" JSONB NOT NULL,
  "value_type" VARCHAR(20) NOT NULL,
  "value" DECIMAL(10, 2) NOT NULL,
  "priority" INTEGER DEFAULT 0 NOT NULL,
  "active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. PROFILES & KYC BY ROLE
CREATE TABLE IF NOT EXISTS "staff_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "branch" VARCHAR(255),
  "region" VARCHAR(255),
  "state" VARCHAR(100),
  "department" VARCHAR(100),
  "professional_certification" VARCHAR(255),
  "grade" VARCHAR(50),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "corporate_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "company_name" VARCHAR(255) NOT NULL,
  "tax_id" VARCHAR(100),
  "industry" VARCHAR(100),
  "company_address" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fleet_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "company_name" VARCHAR(255) NOT NULL,
  "fleet_size" INTEGER DEFAULT 0 NOT NULL,
  "manager_phone" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendor_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "display_name" VARCHAR(255),
  "business_name" VARCHAR(255) NOT NULL,
  "business_phone" VARCHAR(50) NOT NULL,
  "state_region" VARCHAR(100) NOT NULL,
  "city" VARCHAR(100) NOT NULL,
  "home_address" TEXT,
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "bio" TEXT,
  "avatar" TEXT,
  "pending_balance" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "available_balance" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "total_earned" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "vendor_commission_pct" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendor_kyc" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "vendor_type" VARCHAR(50) NOT NULL,
  "business_name" VARCHAR(255) NOT NULL,
  "cac_no" VARCHAR(100),
  "tin" VARCHAR(100),
  "business_license_id" VARCHAR(100),
  "business_permit_id" VARCHAR(100),
  "bank_name" VARCHAR(100) NOT NULL,
  "account_number" VARCHAR(50) NOT NULL,
  "account_name" VARCHAR(255) NOT NULL,
  "government_id_type" VARCHAR(50) NOT NULL,
  "guarantor_name" VARCHAR(255) NOT NULL,
  "guarantor_phone" VARCHAR(50) NOT NULL,
  "guarantor_nin" VARCHAR(50),
  "guarantor_relationship" VARCHAR(100) NOT NULL,
  "guarantors" JSONB DEFAULT '[]'::jsonb,
  "government_id_file" TEXT,
  "business_license_file" TEXT,
  "business_permit_file" TEXT,
  "guarantor_id_file" TEXT,
  "bank_reference_file" TEXT,
  "cac_document_file" TEXT,
  "nafdac_certificate_code" VARCHAR(100),
  "nafdac_certificate_file" TEXT,
  "status" "kyc_status" DEFAULT 'pending' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendor_kyc_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "action" VARCHAR(50) NOT NULL,
  "notes" TEXT,
  "reviewer_id" UUID REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "kyc_submissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "status" "kyc_status" DEFAULT 'unsubmitted' NOT NULL,
  "reference_id" VARCHAR(100) UNIQUE,
  "government_id_type" VARCHAR(50),
  "guarantor_name" VARCHAR(255),
  "guarantor_phone" VARCHAR(50),
  "guarantor_relationship" VARCHAR(100),
  "government_id_url" VARCHAR(500),
  "business_license_url" VARCHAR(500),
  "business_permit_url" VARCHAR(500),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rider_profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rider_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "display_name" VARCHAR(255),
  "phone" VARCHAR(50) NOT NULL,
  "state_region" VARCHAR(100) NOT NULL,
  "city" VARCHAR(100) NOT NULL,
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "bio" TEXT,
  "avatar" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rider_kyc" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rider_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "bank_name" VARCHAR(100) NOT NULL,
  "account_number" VARCHAR(50) NOT NULL,
  "account_name" VARCHAR(255) NOT NULL,
  "vehicle_type" VARCHAR(50) NOT NULL,
  "make_model" VARCHAR(100) NOT NULL,
  "year" INTEGER NOT NULL,
  "plate_number" VARCHAR(50) NOT NULL,
  "color" VARCHAR(50) NOT NULL,
  "insurance_file" TEXT,
  "road_worthiness_file" TEXT,
  "government_id_type" VARCHAR(50) NOT NULL,
  "guarantor_name" VARCHAR(255) NOT NULL,
  "guarantor_phone" VARCHAR(50) NOT NULL,
  "guarantor_nin" VARCHAR(50),
  "guarantor_relationship" VARCHAR(100) NOT NULL,
  "government_id_file" TEXT,
  "guarantor_id_file" TEXT,
  "car_image_file" TEXT,
  "rider_image_file" TEXT,
  "status" "kyc_status" DEFAULT 'pending' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. PRODUCTS & MARKETPLACE
CREATE TABLE IF NOT EXISTS "products" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "sku" VARCHAR(100),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10, 2) NOT NULL,
  "old_price" DECIMAL(10, 2),
  "category_id" UUID REFERENCES "categories"("id"),
  "brand" VARCHAR(100),
  "weight" DECIMAL(8, 2),
  "condition" "product_condition" DEFAULT 'new' NOT NULL,
  "is_negotiable" BOOLEAN DEFAULT false NOT NULL,
  "is_sponsored" BOOLEAN DEFAULT false NOT NULL,
  "sponsored_until" TIMESTAMP,
  "images" JSONB DEFAULT '[]'::jsonb,
  "stock_quantity" INTEGER DEFAULT 0,
  "product_type" "product_type" DEFAULT 'retail' NOT NULL,
  "preparation_time" INTEGER,
  "modifiers" JSONB DEFAULT '[]'::jsonb,
  "variants" JSONB DEFAULT '[]'::jsonb,
  "dietary_tags" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "featured_inventory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "stock" INTEGER DEFAULT 0 NOT NULL,
  "allocated" INTEGER DEFAULT 0 NOT NULL,
  "unit" VARCHAR(50) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'in_stock' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Promotional Campaigns & Welfare
CREATE TABLE IF NOT EXISTS "promotional_campaigns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "date" VARCHAR(50) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'upcoming' NOT NULL,
  "created_by" UUID NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "campaign_allocations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "delivery_ref" VARCHAR(50) NOT NULL UNIQUE,
  "event_id" UUID NOT NULL REFERENCES "promotional_campaigns"("id"),
  "zone_id" UUID NOT NULL REFERENCES "delivery_zones"("id"),
  "rider_id" UUID REFERENCES "users"("id"),
  "total_items" INTEGER NOT NULL,
  "distributed_items" INTEGER DEFAULT 0 NOT NULL,
  "shortage_reported" BOOLEAN DEFAULT false NOT NULL,
  "shortage_description" TEXT,
  "shortage_reported_at" TIMESTAMP,
  "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. ORDERS, CHECKOUT & LOGISTICS
CREATE TABLE IF NOT EXISTS "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_ref" VARCHAR(50) NOT NULL UNIQUE,
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "rider_id" UUID REFERENCES "users"("id"),
  "delivery_zone" VARCHAR(100),
  "status" "order_status" DEFAULT 'pending' NOT NULL,
  "total_amount" DECIMAL(10, 2) NOT NULL,
  "payment_method" "payment_method" NOT NULL,
  "transaction_reference" VARCHAR(255),
  "payment_proof_url" VARCHAR(500),
  "delivery_pin" VARCHAR(6),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "orders"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "order_delivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL UNIQUE REFERENCES "orders"("id"),
  "distance_km" DECIMAL(10, 2) NOT NULL,
  "base_fee" DECIMAL(10, 2) NOT NULL,
  "distance_fee" DECIMAL(10, 2) NOT NULL,
  "rule_adjustments" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "rider_share" DECIMAL(10, 2) NOT NULL,
  "platform_share" DECIMAL(10, 2) NOT NULL,
  "final_delivery_fee" DECIMAL(10, 2) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 7. ESCROW, WALLETS & PAYMENTS
CREATE TABLE IF NOT EXISTS "wallets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id"),
  "balance" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "credit_limit" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "currency" VARCHAR(10) DEFAULT 'NGN' NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "wallet_id" UUID NOT NULL REFERENCES "wallets"("id"),
  "amount" DECIMAL(12, 2) NOT NULL,
  "type" VARCHAR(20) NOT NULL, -- 'credit', 'debit'
  "status" VARCHAR(20) DEFAULT 'successful' NOT NULL,
  "reference" VARCHAR(100),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payouts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "amount" DECIMAL(12, 2) NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'processed', 'failed'
  "reference" VARCHAR(100) UNIQUE,
  "failure_reason" TEXT,
  "bank_code" VARCHAR(20) NOT NULL,
  "account_number" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "resolved_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "escrow_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "orders"("id"),
  "buyer_id" UUID NOT NULL REFERENCES "users"("id"),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "amount" DECIMAL(12, 2) NOT NULL,
  "platform_fee" DECIMAL(12, 2) DEFAULT '0.00' NOT NULL,
  "status" VARCHAR(50) DEFAULT 'held' NOT NULL, -- 'held', 'released', 'disputed', 'refunded'
  "released_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "disputes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrow_id" UUID NOT NULL REFERENCES "escrow_transactions"("id"),
  "raised_by_id" UUID NOT NULL REFERENCES "users"("id"),
  "reason" TEXT NOT NULL,
  "evidence_urls" JSONB DEFAULT '[]'::jsonb,
  "status" "dispute_status" DEFAULT 'open' NOT NULL,
  "resolution_notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 8. SHOPPER INTERACTIONS (Cart, Wishlist, Reviews, Addresses, Coupons)
CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "quantity" INTEGER DEFAULT 1 NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "discount_type" VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
  "discount_value" DECIMAL(10, 2) NOT NULL,
  "min_order_value" DECIMAL(10, 2) DEFAULT '0.00',
  "max_uses" INTEGER,
  "uses_count" INTEGER DEFAULT 0 NOT NULL,
  "valid_from" TIMESTAMP NOT NULL,
  "valid_until" TIMESTAMP NOT NULL,
  "active" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "addresses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "label" VARCHAR(100) NOT NULL,
  "address" TEXT NOT NULL,
  "landmark" VARCHAR(255),
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "is_default" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 9. VALUE-ADDED SERVICES & CHAT
CREATE TABLE IF NOT EXISTS "verification_otps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "otp" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" VARCHAR(50) NOT NULL,
  "actor_id" UUID REFERENCES "users"("id"),
  "actor_name" VARCHAR(255) NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "module" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "ip_address" VARCHAR(50),
  "status" VARCHAR(50) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "agent_id" UUID REFERENCES "users"("id"),
  "status" "support_ticket_status" DEFAULT 'open' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL REFERENCES "support_tickets"("id"),
  "sender_id" UUID REFERENCES "users"("id"),
  "message" TEXT NOT NULL,
  "is_bot" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bill_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "category" VARCHAR(50) NOT NULL,
  "provider" VARCHAR(100) NOT NULL,
  "customer" VARCHAR(100) NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "reference" VARCHAR(100) NOT NULL UNIQUE,
  "status" VARCHAR(20) DEFAULT 'pending' NOT NULL,
  "api_response" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sponsored_ads" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "amount_paid" DECIMAL(10, 2) NOT NULL,
  "start_date" TIMESTAMP DEFAULT NOW() NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_id" UUID NOT NULL REFERENCES "users"("id"),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL REFERENCES "conversations"("id"),
  "sender_id" UUID NOT NULL REFERENCES "users"("id"),
  "content" TEXT,
  "is_offer" BOOLEAN DEFAULT FALSE NOT NULL,
  "offer_amount" DECIMAL(12, 2),
  "offer_status" "offer_status",
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "promotions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vendor_id" UUID NOT NULL REFERENCES "users"("id"),
  "product_id" UUID NOT NULL REFERENCES "products"("id"),
  "amount_paid" DECIMAL(10, 2) NOT NULL,
  "duration_days" INTEGER NOT NULL,
  "status" VARCHAR(50) DEFAULT 'active' NOT NULL,
  "start_date" TIMESTAMP DEFAULT NOW() NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrer_id" UUID NOT NULL REFERENCES "users"("id"),
  "referred_user_id" UUID NOT NULL REFERENCES "users"("id"),
  "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
  "reward_amount" DECIMAL(10, 2) DEFAULT '1000.00' NOT NULL,
  "friend_reward_amount" DECIMAL(10, 2) DEFAULT '500.00' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completed_at" TIMESTAMP
);

-- 10. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");

CREATE INDEX IF NOT EXISTS "products_vendor_id_idx" ON "products"("vendor_id");
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "products_product_type_idx" ON "products"("product_type");
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");

CREATE INDEX IF NOT EXISTS "orders_user_created_idx" ON "orders"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_vendor_status_idx" ON "orders"("vendor_id", "status");
CREATE INDEX IF NOT EXISTS "orders_rider_id_idx" ON "orders"("rider_id");
CREATE INDEX IF NOT EXISTS "orders_order_ref_idx" ON "orders"("order_ref");

CREATE INDEX IF NOT EXISTS "vendor_profiles_vendor_id_idx" ON "vendor_profiles"("vendor_id");
CREATE INDEX IF NOT EXISTS "vendor_profiles_region_city_idx" ON "vendor_profiles"("state_region", "city");

CREATE INDEX IF NOT EXISTS "escrow_buyer_id_idx" ON "escrow_transactions"("buyer_id");
CREATE INDEX IF NOT EXISTS "escrow_vendor_id_idx" ON "escrow_transactions"("vendor_id");
CREATE INDEX IF NOT EXISTS "escrow_status_idx" ON "escrow_transactions"("status");
