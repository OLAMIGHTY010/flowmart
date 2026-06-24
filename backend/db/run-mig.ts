import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to database.');

    const migrationDir = path.join(__dirname, 'migration');
    const sqlFiles = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      
      const statements = sqlContent.split('--> statement-breakpoint');
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        try {
          await client.query(stmt);
        } catch (err: any) {
          // 42701 is column_already_exists
          // 42P07 is duplicate_table
          // 42710 is duplicate_object (like enums or types already existing)
          if (err.code === '42701' || err.code === '42P07' || err.code === '42710') {
            console.log(`[Skipping] ${err.message}`);
          } else {
            console.error(`Error in statement ${i} of ${file}:`, err.message);
            console.error(`Statement was:`, stmt);
            throw err;
          }
        }
      }
      console.log(`Migration ${file} executed successfully (or changes already applied).`);
    }

    console.log('All migrations executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
