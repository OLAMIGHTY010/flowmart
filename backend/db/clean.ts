import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function clean() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('TRUNCATE TABLE audit_logs CASCADE;');
    console.log('Dummy logs cleared successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
clean();
