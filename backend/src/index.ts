import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { testDatabaseConnection } from "../db";
import routes from "./routes";
import { initWebSocketHub } from "./services/websocket";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'https://flowmart-iota.vercel.app',
      'https://flowmart-opal.vercel.app',
      'http://localhost:5174'
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: origin ${origin} is not allowed.`);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 👉 Root Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "FlowMart API is running" 
  });
});

import { Pool } from 'pg';

app.get("/api/v1/fix-db", async (req, res) => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    
    // Using IF NOT EXISTS safely (or try-catch if Postgres version requires it)
    await client.query(`
      DO $$ 
      BEGIN 
        -- Users
        BEGIN ALTER TABLE users ADD COLUMN otp varchar(255); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE users ADD COLUMN otp_expiry timestamp; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE users ADD COLUMN reset_token varchar(255); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE users ADD COLUMN reset_token_expiry timestamp; EXCEPTION WHEN duplicate_column THEN END;
        
        -- Rider Profiles
        BEGIN ALTER TABLE rider_profiles ADD COLUMN latitude numeric(10, 8); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE rider_profiles ADD COLUMN longitude numeric(11, 8); EXCEPTION WHEN duplicate_column THEN END;
        
        -- Vendor Profiles
        BEGIN ALTER TABLE vendor_profiles ADD COLUMN latitude numeric(10, 8); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE vendor_profiles ADD COLUMN longitude numeric(11, 8); EXCEPTION WHEN duplicate_column THEN END;

        -- Rider KYC
        BEGIN ALTER TABLE rider_kyc ADD COLUMN guarantor_nin varchar(50); EXCEPTION WHEN duplicate_column THEN END;

        -- Vendor KYC
        BEGIN ALTER TABLE vendor_kyc ADD COLUMN guarantor_nin varchar(50); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE vendor_kyc ADD COLUMN vendor_type varchar(50) DEFAULT 'individual' NOT NULL; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE vendor_kyc ADD COLUMN tin varchar(255); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE vendor_kyc ADD COLUMN bank_reference_file text; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE vendor_kyc ADD COLUMN cac_document_file text; EXCEPTION WHEN duplicate_column THEN END;

        -- Products
        BEGIN ALTER TABLE products ADD COLUMN product_type varchar(50) DEFAULT 'retail' NOT NULL; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE products ADD COLUMN preparation_time integer; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE products ADD COLUMN modifiers jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE products ADD COLUMN dietary_tags jsonb DEFAULT '[]'::jsonb; EXCEPTION WHEN duplicate_column THEN END;

        -- Renames (0003)
        BEGIN ALTER TABLE orders RENAME COLUMN attendee_id TO user_id; EXCEPTION WHEN undefined_column THEN END;
        BEGIN ALTER TABLE vendor_kyc RENAME COLUMN camp_certificate_id TO business_license_id; EXCEPTION WHEN undefined_column THEN END;
        BEGIN ALTER TABLE vendor_kyc RENAME COLUMN camp_certificate_file TO business_license_file; EXCEPTION WHEN undefined_column THEN END;
        BEGIN ALTER TABLE kyc_submissions RENAME COLUMN camp_certificate_url TO business_license_url; EXCEPTION WHEN undefined_column THEN END;
        BEGIN ALTER TABLE staff_profiles RENAME COLUMN church TO branch; EXCEPTION WHEN undefined_column THEN END;
        BEGIN ALTER TABLE staff_profiles RENAME COLUMN zonal TO region; EXCEPTION WHEN undefined_column THEN END;
      END $$;
    `);
    client.release();
    
    res.status(200).json({ success: true, message: "Database columns added successfully!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Failed to update DB: ${error?.message || error}` });
  }
});

app.use("/api/v1", routes);

const PORT = process.env.PORT || 5000;

// Only start the server locally. Vercel will use the exported app directly.
if (process.env.NODE_ENV !== "production") {
	testDatabaseConnection()
		.then(() => {
			initWebSocketHub(server);

			server.listen(PORT, () => {
				console.log(
					`FlowMart Server & WebSocket Hub is running on port ${PORT}`
				);
			});
		})
		.catch((error: Error) => {
			console.error("Failed to start server:", error);
			process.exit(1);
		});
}

export default app;
