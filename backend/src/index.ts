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

import { globalApiLimiter } from "./middleware/rateLimiter.middleware";

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

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xContentTypeOptions: true,
  dnsPrefetchControl: { allow: false },
  hidePoweredBy: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 👉 Root Welcome Route
app.get("/", (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "FlowMart API is running" 
  });
});



import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

import { emailService } from './services/email.service';
app.get(['/api/v1/test-smtp', '/v1/test-smtp'], async (req, res) => {
  try {
    await (emailService as any).transporter.verify();
    res.json({ success: true, message: 'SMTP connected successfully!', env: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER ? 'SET' : 'UNSET' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, code: error.code, env: { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER ? 'SET' : 'UNSET' } });
  }
});

app.use("/api/v1", globalApiLimiter, routes);
app.use("/v1", globalApiLimiter, routes);

const PORT = process.env.PORT || 5000;

// Only start the server locally. Vercel will use the exported app directly.
	testDatabaseConnection()
		.then(() => {
			initWebSocketHub(server);

		if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
			server.listen(PORT, () => {
				console.log(
					`FlowMart Server & WebSocket Hub is running on port ${PORT}`
				);
			});
		}
	})
	.catch((error: Error) => {
		console.error("Failed to connect to database:", error.message);
		console.warn("WARNING: Server starting without database connection. API requests will fail until DATABASE_URL is corrected.");
		
		initWebSocketHub(server);
		
		if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
			server.listen(PORT, () => {
				console.log(
					`FlowMart Server & WebSocket Hub is running on port ${PORT} (NO DATABASE)`
				);
			});
		}
	});

export default app;
