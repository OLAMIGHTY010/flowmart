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
      'https://flowmart-opal.vercel.app'
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
