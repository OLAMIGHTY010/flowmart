import { pool } from './index';

/**
 * Automatically synchronizes PostgreSQL database schema with Drizzle models.
 * Applies missing columns, tables, enums, and indexes idempotently using IF NOT EXISTS.
 */
export const syncDatabaseSchema = async () => {
  const client = await pool.connect();
  const results: { statement: string; status: string; error?: string }[] = [];

  const statements = [
    // 1. Enums
    `DO $$ BEGIN ALTER TYPE role ADD VALUE IF NOT EXISTS 'corporate_buyer'; EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;`,
    `DO $$ BEGIN ALTER TYPE role ADD VALUE IF NOT EXISTS 'fleet_manager'; EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;`,
    `DO $$ BEGIN ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'real_estate'; EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;`,
    `DO $$ BEGIN ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'vehicle'; EXCEPTION WHEN duplicate_object THEN null; WHEN undefined_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

    // 2. Users table columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES users(id);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(50);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW() NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profileVisibility":true,"showOnlineStatus":true,"locationTracking":false}'::jsonb;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;`,

    // 3. Products table columns
    `DO $$ BEGIN CREATE TYPE product_condition AS ENUM ('new', 'used_like_new', 'used_good', 'used_fair'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS condition product_condition DEFAULT 'new' NOT NULL;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false NOT NULL;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price DECIMAL(10, 2);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(8, 2);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMP;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS preparation_time INTEGER;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb;`,

    // 4. Vendor profiles and KYC columns
    `ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS home_address TEXT;`,
    `ALTER TABLE vendor_kyc ADD COLUMN IF NOT EXISTS guarantors JSONB DEFAULT '[]'::jsonb;`,

    // 5. Wallets extensions
    `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12, 2) DEFAULT '0.00' NOT NULL;`,

    // 6. Corporate Profiles table
    `CREATE TABLE IF NOT EXISTS corporate_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      company_name VARCHAR(255) NOT NULL,
      tax_id VARCHAR(100),
      industry VARCHAR(100),
      company_address TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,

    // 7. Fleet Profiles table
    `CREATE TABLE IF NOT EXISTS fleet_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      company_name VARCHAR(255) NOT NULL,
      fleet_size INTEGER NOT NULL DEFAULT 0,
      manager_phone VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,

    // 8. Conversations and Messages tables (Chat)
    `CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      buyer_id UUID NOT NULL REFERENCES users(id),
      vendor_id UUID NOT NULL REFERENCES users(id),
      product_id UUID NOT NULL REFERENCES products(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id),
      sender_id UUID NOT NULL REFERENCES users(id),
      content TEXT,
      is_offer BOOLEAN NOT NULL DEFAULT FALSE,
      offer_amount DECIMAL(12, 2),
      offer_status offer_status,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,

    // 9. Promotions table
    `CREATE TABLE IF NOT EXISTS promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID NOT NULL REFERENCES users(id),
      product_id UUID NOT NULL REFERENCES products(id),
      amount_paid DECIMAL(10, 2) NOT NULL,
      duration_days INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      start_date TIMESTAMP NOT NULL DEFAULT NOW(),
      end_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,

    // 10. Referrals table
    `CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES users(id),
      referred_user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      reward_amount DECIMAL(10, 2) NOT NULL DEFAULT '1000.00',
      friend_reward_amount DECIMAL(10, 2) NOT NULL DEFAULT '500.00',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP
    );`,

    // 11. Performance Indexes
    `CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`,
    `CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);`,
    `CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);`,
    `CREATE INDEX IF NOT EXISTS products_vendor_id_idx ON products(vendor_id);`,
    `CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);`,
    `CREATE INDEX IF NOT EXISTS products_product_type_idx ON products(product_type);`,
    `CREATE INDEX IF NOT EXISTS products_name_idx ON products(name);`,
    `CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at);`,
    `CREATE INDEX IF NOT EXISTS orders_vendor_status_idx ON orders(vendor_id, status);`,
    `CREATE INDEX IF NOT EXISTS orders_rider_id_idx ON orders(rider_id);`,
    `CREATE INDEX IF NOT EXISTS orders_order_ref_idx ON orders(order_ref);`,
    `CREATE INDEX IF NOT EXISTS vendor_profiles_vendor_id_idx ON vendor_profiles(vendor_id);`,
    `CREATE INDEX IF NOT EXISTS vendor_profiles_region_city_idx ON vendor_profiles(state_region, city);`,
    `CREATE INDEX IF NOT EXISTS escrow_buyer_id_idx ON escrow_transactions(buyer_id);`,
    `CREATE INDEX IF NOT EXISTS escrow_vendor_id_idx ON escrow_transactions(vendor_id);`,
    `CREATE INDEX IF NOT EXISTS escrow_status_idx ON escrow_transactions(status);`
  ];

  try {
    for (const sql of statements) {
      try {
        await client.query(sql);
        results.push({ statement: sql.trim().slice(0, 60), status: 'SUCCESS' });
      } catch (err: any) {
        if (['42701', '42P07', '42710'].includes(err.code)) {
          results.push({ statement: sql.trim().slice(0, 60), status: 'ALREADY_EXISTS' });
        } else {
          console.error('Schema sync warning:', err.message);
          results.push({ statement: sql.trim().slice(0, 60), status: 'ERROR', error: err.message });
        }
      }
    }
    console.log('Database schema synchronization completed.');
  } finally {
    client.release();
  }

  return results;
};
