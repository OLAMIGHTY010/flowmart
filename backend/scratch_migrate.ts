import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Adding NAFDAC columns to vendor_kyc...");
    await client.query(`ALTER TABLE "vendor_kyc" ADD COLUMN IF NOT EXISTS "nafdac_certificate_code" varchar(255);`);
    await client.query(`ALTER TABLE "vendor_kyc" ADD COLUMN IF NOT EXISTS "nafdac_certificate_file" text;`);
    
    console.log("Creating vendor_kyc_history table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "vendor_kyc_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "vendor_id" uuid NOT NULL,
        "action" varchar(50) NOT NULL,
        "notes" text,
        "reviewer_id" uuid,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    console.log("Adding foreign keys...");
    try {
      await client.query(`ALTER TABLE "vendor_kyc_history" ADD CONSTRAINT "vendor_kyc_history_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`);
    } catch (e) { console.log("FK 1 already exists or error", e.message); }
    
    try {
      await client.query(`ALTER TABLE "vendor_kyc_history" ADD CONSTRAINT "vendor_kyc_history_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`);
    } catch (e) { console.log("FK 2 already exists or error", e.message); }
    
    console.log("Done!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
