import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log("Resetting database schema...");
    await client.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    console.log("Database schema reset successfully!");
  } catch (err: any) {
    console.error("Error resetting database:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
