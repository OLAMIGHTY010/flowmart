import dotenv from 'dotenv';
dotenv.config();

import { db } from './db';
import { products } from './db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Resetting stock for all products in local PostgreSQL database...");
    const updated = await db.update(products).set({
      stockQuantity: 100
    }).returning();
    console.log(`Successfully updated stock for ${updated.length} products to 100!`);
  } catch (error) {
    console.error("Error resetting stock:", error);
  }
}

main();
