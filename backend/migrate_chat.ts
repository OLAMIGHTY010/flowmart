import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES users(id),
        vendor_id UUID NOT NULL REFERENCES users(id),
        product_id UUID NOT NULL REFERENCES products(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id),
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT,
        is_offer BOOLEAN NOT NULL DEFAULT FALSE,
        offer_amount DECIMAL(12, 2),
        offer_status offer_status,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

run();
