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

// --- FIX 1: Trust the Vercel Proxy ---
// Required if you add rate-limiting later or need accurate IP tracking
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://riderflowmart.vercel.app',
      'https://flowmart-iota.vercel.app',
      'https://userflowmart.vercel.app',
      'https://flowmart-vendor.vercel.app'
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: origin ${origin} is not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check route (Useful for Vercel checks)
app.get("/", (req, res) => res.send("FlowMart API is running"));

app.use("/api/v1", routes);

// --- FIX 2: Handle Database Connection Gracefully ---
// Test DB connection, but do not block the export or wrap the server in it
testDatabaseConnection().catch((error: Error) => {
	console.error("Database connection failed:", error);
});

// --- FIX 3: Separate Local execution from Vercel Serverless ---
// Vercel sets process.env.VERCEL to "1" in its environments.
// If we are NOT on Vercel, spin up the HTTP Server & WebSockets
if (!process.env.VERCEL) {
	const PORT = process.env.PORT || 5000;
	const server = http.createServer(app);
	
	initWebSocketHub(server);

	server.listen(PORT, () => {
		console.log(`FlowMart Server & WebSocket Hub is running on port ${PORT}`);
	});
}

// --- FIX 4: Crucial Vercel Export ---
// Vercel specifically looks for a `default` export to consume the Express app
export default app;