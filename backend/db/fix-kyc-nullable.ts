import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Altering vendor_kyc columns to match schema (dropping NOT NULL on nullable fields)...");
    await client.query('ALTER TABLE vendor_kyc ALTER COLUMN tin DROP NOT NULL;');
    await client.query('ALTER TABLE vendor_kyc ALTER COLUMN bank_reference_file DROP NOT NULL;');
    await client.query('ALTER TABLE vendor_kyc ALTER COLUMN cac_document_file DROP NOT NULL;');
    console.log("Successfully updated columns.");
  } catch (error) {
    console.error("Error updating columns:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
