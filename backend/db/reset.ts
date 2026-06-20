import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function reset() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected. Dropping schema public...');
    await client.query('DROP SCHEMA public CASCADE;');
    console.log('Recreating schema public...');
    await client.query('CREATE SCHEMA public;');
    console.log('Database cleared successfully.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
