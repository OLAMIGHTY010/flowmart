import request from "supertest";
import express from "express";
import welfareRouter from "../../routes/welfare.routes";

// 1. Database Mock Layer supporting fluent chaining
jest.mock("../../db", () => {
	const chain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		then: jest.fn(),
	};
	return { db: chain };
});

// 2. Auth Middleware Mocking tailored for Welfare Roles
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized" });
		}
		if (authHeader === "Bearer coordinator-token") {
			req.user = { id: "coord-123", role: "camp_logistics_coordinator" };
		} else if (authHeader === "Bearer regular-token") {
			req.user = { id: "attendee-789", role: "attendee" };
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

// 3. Mock Email Service to capture background welfare alerts
jest.mock("../services/email.service", () => ({
	emailService: {
		sendWelfareAllocationAlert: jest.fn().mockResolvedValue(true),
	},
}));

import { db } from "../../../db";
const mockDb = db as any;

const app = express();
app.use(express.json());
app.use("/api/v1/welfare", welfareRouter);

describe("Welfare Routing Layer - Integration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockDb.select.mockReturnThis();
		mockDb.from.mockReturnThis();
		mockDb.where.mockReturnThis();
		mockDb.limit.mockReturnThis();
		mockDb.insert.mockReturnThis();
		mockDb.values.mockReturnThis();
		mockDb.returning.mockReturnThis();
	});

	describe("Global Welfare Route Security Guard Rails", () => {
		it("should block unauthorized roles (like attendee) with a 403 Forbidden status", async () => {
			const response = await request(app)
				.get("/api/v1/welfare/reports")
				.set("Authorization", "Bearer regular-token");

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});
	});

	describe("POST /api/v1/welfare/events", () => {
		it("should successfully schedule a new welfare distribution event", async () => {
			const mockEvent = {
				id: "event-001",
				name: "Ramadan Aid Package",
				date: "2026-06-25",
				createdBy: "coord-123",
			};
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([mockEvent]).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/welfare/events")
				.set("Authorization", "Bearer coordinator-token")
				.send({ name: "Ramadan Aid Package", date: "2026-06-25" });

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.event.name).toBe("Ramadan Aid Package");
		});

		it("should fall back to a 500 server error status if insertion breaks down", async () => {
			mockDb.then.mockImplementationOnce(
				(onFulfilled: any, onRejected: any) =>
					Promise.reject(new Error("DB Connection Timeout")).catch(
						onRejected
					)
			);

			const response = await request(app)
				.post("/api/v1/welfare/events")
				.set("Authorization", "Bearer coordinator-token")
				.send({ name: "Failed Event", date: "2026-06-25" });

			expect(response.status).toBe(500);
			expect(response.body.success).toBe(false);
		});
	});

	describe("POST /api/v1/welfare/allocations", () => {
		it("should allocate tracking items and fire off an alert to the zone coordinator", async () => {
			const mockAllocation = {
				id: "alloc-99",
				eventId: "event-001",
				zoneId: "zone-north",
				totalItems: 150,
			};
			const mockEventDetails = [
				{ id: "event-001", name: "Ramadan Aid Package" },
			];
			const mockCoordinatorProfile = [
				{
					id: "user-coord",
					role: "zone_coordinator",
					email: "north_coord@flowmart.com",
					fullName: "Aliyu Musa",
				},
			];

			// 1. Allocation Record Insertion Flow
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([mockAllocation]).then(onFulfilled)
			);
			// 2. Background lookup: Fetch event title
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockEventDetails).then(onFulfilled)
			);
			// 3. Background lookup: Identify targeting coordinator
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockCoordinatorProfile).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/welfare/allocations")
				.set("Authorization", "Bearer coordinator-token")
				.send({
					eventId: "event-001",
					zoneId: "zone-north",
					totalItems: 150,
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.allocation.totalItems).toBe(150);
		});
	});

	describe("GET /api/v1/welfare/reports", () => {
		it("should aggregate and yield all welfare allocation reports securely", async () => {
			const mockReports = [
				{
					id: "alloc-1",
					eventId: "event-1",
					zoneId: "zone-a",
					totalItems: 50,
				},
				{
					id: "alloc-2",
					eventId: "event-2",
					zoneId: "zone-b",
					totalItems: 120,
				},
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockReports).then(onFulfilled)
			);

			const response = await request(app)
				.get("/api/v1/welfare/reports")
				.set("Authorization", "Bearer coordinator-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.reports).toHaveLength(2);
		});
	});
});
