import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; 
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com')) || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
});

export const db = drizzle(pool, { schema });

export const testDatabaseConnection = async () => {
  const client = await pool.connect();
  try {
    console.log('Successfully connected to PostgreSQL Database');
  } finally {
    client.release();
  }
};
