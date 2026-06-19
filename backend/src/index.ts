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

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/v1", routes);

const PORT = process.env.PORT || 5000;

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

export { app };
