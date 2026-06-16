import request from "supertest";
import http from "http";

// 1. Mock DB and Socket Services BEFORE requiring index.ts
const mockTestDatabaseConnection = jest.fn();
jest.mock("../db", () => ({
	testDatabaseConnection: () => mockTestDatabaseConnection(),
}));

const mockInitWebSocketHub = jest.fn();
jest.mock("./services/websocket", () => ({
	initWebSocketHub: (server: any) => mockInitWebSocketHub(server),
}));

// Mock routing layout to keep this entry test isolated
jest.mock("./routes", () => {
	const router = require("express").Router();
	router.get("/sanity-check", (req: any, res: any) => res.json({ up: true }));
	return router;
});

describe("Global Application Bootstrap Layer - Integration Tests", () => {
	let consoleLogSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;
	let processExitSpy: jest.SpyInstance;
	let serverListenSpy: jest.SpyInstance;

	// Capture the real un-spied listen function
	const originalListen = http.Server.prototype.listen;

	beforeEach(() => {
		jest.clearAllMocks();

		// Catch output and intercept process lifecycles to keep test console clean
		consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
		processExitSpy = jest
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);

		// FIXED: Only mock the application port binding, let Supertest's internal port 0 pass through
		serverListenSpy = jest
			.spyOn(http.Server.prototype, "listen")
			.mockImplementation(function (this: any, ...args: any[]) {
				const port = args[0];
				if (port === 0 || port === "0") {
					return originalListen.apply(this, args as any);
				}

				const callback = args.find((arg) => typeof arg === "function");
				if (callback) {
					callback();
				}
				return this;
			});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
		serverListenSpy.mockRestore();

		// Wipe module registry cache to allow clean evaluation for each test case
		jest.resetModules();
	});

	it("should cleanly execute initialization when database verification succeeds", async () => {
		mockTestDatabaseConnection.mockResolvedValue(true);

		// Dynamically require index.ts to evaluate initialization block under mocks
		const { app } = require("./index");

		// Fast-forward asynchronous promise resolution microtasks
		await new Promise(process.nextTick);

		// Confirm core middlewares (CORS, Helmet, JSON Parser) and base routes work safely
		const response = await request(app).get("/api/v1/sanity-check");
		expect(response.status).toBe(200);
		expect(response.body).toEqual({ up: true });

		// Confirm architectural hooks started up perfectly
		expect(mockTestDatabaseConnection).toHaveBeenCalled();
		expect(mockInitWebSocketHub).toHaveBeenCalled();
		expect(serverListenSpy).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining(
				"FlowMart Server & WebSocket Hub is running on port"
			)
		);
	});

	it("should intercept connection breakdowns, log to trace logs, and gracefully exit code 1", async () => {
		const databaseError = new Error("Postgres connection timeout");
		mockTestDatabaseConnection.mockRejectedValue(databaseError);

		require("./index");

		// Fast-forward microtasks to let the .catch() fallback trigger
		await new Promise(process.nextTick);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to start server:",
			databaseError
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});
});
