import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: "./db/schema.ts", // Pointing to root db folder
  out: "./db/migration",    // Outputting to root db folder
  dialect: "postgresql", 
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});