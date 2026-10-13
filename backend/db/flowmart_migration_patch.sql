-- ============================================================================
-- FLOWMART DATABASE MIGRATION PATCH (Idempotent Update for Existing Database)
-- ============================================================================
-- Safe to execute against an existing FlowMart database.
-- Adds missing enums, columns, tables, and indexes without dropping existing data.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS UPDATE (Safely add newly introduced enum values)
DO $$ BEGIN
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'logistics_manager';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'regional_manager';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'regional_coordinator';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'area_manager';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'user';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'customer';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'corporate_buyer';
  ALTER TYPE role ADD VALUE IF NOT EXISTS 'fleet_manager';
EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'real_estate';
  ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'vehicle';
EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE product_condition AS ENUM ('new', 'used_like_new', 'used_good', 'used_fair');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_buyer_refunded', 'resolved_vendor_paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. USERS TABLE - MISSING COLUMNS
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW() NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profileVisibility":true,"showOnlineStatus":true,"locationTracking":false}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- 4. PRODUCTS TABLE - MISSING COLUMNS
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition product_condition DEFAULT 'new' NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- 5. VENDOR PROFILES & KYC EXTENSIONS
ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE vendor_kyc ADD COLUMN IF NOT EXISTS guarantors JSONB DEFAULT '[]'::jsonb;

-- 6. WALLETS EXTENSIONS
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2) DEFAULT '0.00' NOT NULL;

-- 7. NEW TABLES

-- Corporate Buyer Profiles
CREATE TABLE IF NOT EXISTS corporate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(100),
  industry VARCHAR(100),
  company_address TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Fleet Manager Profiles
CREATE TABLE IF NOT EXISTS fleet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  company_name VARCHAR(255) NOT NULL,
  fleet_size INTEGER DEFAULT 0 NOT NULL,
  manager_phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Conversations & Chat Messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  is_offer BOOLEAN DEFAULT FALSE NOT NULL,
  offer_amount DECIMAL(12, 2),
  offer_status offer_status,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Sponsored Promotions Engine
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  amount_paid DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  start_date TIMESTAMP DEFAULT NOW() NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Referral & Rewards Engine
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  reward_amount DECIMAL(10, 2) DEFAULT '1000.00' NOT NULL,
  friend_reward_amount DECIMAL(10, 2) DEFAULT '500.00' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS products_vendor_id_idx ON products(vendor_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_product_type_idx ON products(product_type);
CREATE INDEX IF NOT EXISTS products_name_idx ON products(name);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_vendor_status_idx ON orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS orders_rider_id_idx ON orders(rider_id);
CREATE INDEX IF NOT EXISTS orders_order_ref_idx ON orders(order_ref);
CREATE INDEX IF NOT EXISTS vendor_profiles_vendor_id_idx ON vendor_profiles(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_profiles_region_city_idx ON vendor_profiles(state_region, city);
CREATE INDEX IF NOT EXISTS escrow_buyer_id_idx ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS escrow_vendor_id_idx ON escrow_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS escrow_status_idx ON escrow_transactions(status);
