import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema'; 
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
