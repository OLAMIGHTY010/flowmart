import request from "supertest";
import express from "express";
import analyticsRouter from "../../routes/analytics.routes";

// 1. Database Fluent Chain Mock
jest.mock("../../db", () => {
	const chain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		then: jest.fn(),
	};
	return { db: chain };
});

// 2. Auth Middleware Mocking
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		const authHeader = req.headers.authorization;
		if (authHeader === "Bearer admin-token") {
			req.user = { id: "admin-1", role: "super_admin" };
		} else {
			req.user = { id: "user-1", role: "attendee" };
		}
		next();
	},
	authorizeRoles:
		(...roles: string[]) =>
		(req: any, res: any, next: any) => {
			if (!req.user || !roles.includes(req.user.role)) {
				return res
					.status(403)
					.json({ success: false, message: "Forbidden" });
			}
			next();
		},
}));

import { db } from "../../../db";
const mockDb = db as any;

const app = express();
app.use(express.json());
app.use("/api/v1/analytics", analyticsRouter);

describe("Analytics Routing Layer - Integration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should return 403 Forbidden for non-admin users", async () => {
		const response = await request(app)
			.get("/api/v1/analytics")
			.set("Authorization", "Bearer user-token"); // attendee role

		expect(response.status).toBe(403);
	});

	it("should return aggregated commerce and welfare stats for super_admin", async () => {
		const mockOrderStats = { totalOrders: 10, deliveredOrders: 8 };
		const mockWelfareStats = {
			totalAllocated: 100,
			totalDistributed: 90,
			totalShortages: 2,
		};

		// Mock the two select calls in getDashboardStats
		mockDb.then
			.mockImplementationOnce((fn: any) =>
				Promise.resolve([mockOrderStats]).then(fn)
			)
			.mockImplementationOnce((fn: any) =>
				Promise.resolve([mockWelfareStats]).then(fn)
			);

		const response = await request(app)
			.get("/api/v1/analytics")
			.set("Authorization", "Bearer admin-token");

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.stats.commerce.totalOrders).toBe(10);
		expect(response.body.stats.welfare.totalAllocated).toBe(100);
	});

	it("should return 500 if database aggregation fails", async () => {
		// FIX: Using the exact resolve/reject parameters to properly close the promise
		mockDb.then.mockImplementationOnce((resolve: any, reject: any) => {
			reject(new Error("DB Error"));
		});

		const response = await request(app)
			.get("/api/v1/analytics")
			.set("Authorization", "Bearer admin-token");

		expect(response.status).toBe(500);
		expect(response.body.success).toBe(false);
	});
});
