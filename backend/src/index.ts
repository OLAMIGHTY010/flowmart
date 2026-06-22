import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { testDatabaseConnection } from "../db";
import routes from "./routes";
import { initWebSocketHub } from "./services/websocket";
import { startCronJobs } from "./services/cron.service";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
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

app.use("/api/v1", routes);

const PORT = process.env.PORT || 5000;

testDatabaseConnection()
	.then(() => {
		initWebSocketHub(server);
		startCronJobs();

		server.listen(PORT, () => {
			console.log(
				`FlowMart Server & WebSocket Hub is running on port ${PORT}`
			);
		});
	})
	.catch((error: Error) => {
		console.error("Failed to connect to database:", error.message);
		console.warn("WARNING: Server starting without database connection. API requests will fail until DATABASE_URL is corrected.");
		
		initWebSocketHub(server);
		server.listen(PORT, () => {
			console.log(
				`FlowMart Server & WebSocket Hub is running on port ${PORT} (NO DATABASE)`
			);
		});
	});

export { app };
