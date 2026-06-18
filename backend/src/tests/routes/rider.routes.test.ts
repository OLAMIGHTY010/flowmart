import request from "supertest";
import express from "express";
import riderRouter from "../../routes/rider.routes";

// 1. Database Mock Layer supporting fluent chaining
jest.mock("../../db", () => {
	const chain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		then: jest.fn(),
	};
	return { db: chain };
});

// 2. Control Middleware Mocking tailored for Dispatch Riders
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized" });
		}
		if (authHeader === "Bearer rider-token") {
			req.user = { id: "rider-abc", role: "dispatch_rider" };
		} else if (authHeader === "Bearer regular-token") {
			req.user = { id: "attendee-xyz", role: "attendee" };
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

// 3. Mock Email Service to prevent unhandled background rejections
jest.mock("../services/email.service", () => ({
	emailService: {
		sendDeliveryConfirmationEmail: jest.fn().mockResolvedValue(true),
	},
}));

import { db } from "../../../db";
const mockDb = db as any;

const app = express();
app.use(express.json());
app.use("/api/v1/riders", riderRouter);

describe("Rider Routing Layer - Integration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockDb.select.mockReturnThis();
		mockDb.from.mockReturnThis();
		mockDb.where.mockReturnThis();
		mockDb.limit.mockReturnThis();
		mockDb.insert.mockReturnThis();
		mockDb.values.mockReturnThis();
		mockDb.update.mockReturnThis();
		mockDb.set.mockReturnThis();
		mockDb.returning.mockReturnThis();
	});

	describe("Global Route Guard Rails", () => {
		it("should block non-riders (like attendees) with a 403 Forbidden status", async () => {
			const response = await request(app)
				.get("/api/v1/riders/available")
				.set("Authorization", "Bearer regular-token");

			expect(response.status).toBe(403);
		});
	});

	describe("GET /api/v1/riders/available", () => {
		it("should fetch all orders that are confirmed and awaiting rider assignment", async () => {
			const mockOrders = [
				{ id: "order-1", status: "confirmed", riderId: null },
				{ id: "order-2", status: "confirmed", riderId: null },
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockOrders).then(onFulfilled)
			);

			const response = await request(app)
				.get("/api/v1/riders/available")
				.set("Authorization", "Bearer rider-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.deliveries).toHaveLength(2);
		});
	});

	describe("POST /api/v1/riders/:id/accept", () => {
		it("should return a 400 error if the package is already claimed or missing", async () => {
			// Simulate empty selection (order not found or riderId is not null)
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/riders/order-stale/accept")
				.set("Authorization", "Bearer rider-token");

			expect(response.status).toBe(400);
			expect(response.body.message).toContain(
				"Delivery no longer available"
			);
		});

		it("should update order status to assigned when successfully claimed by a rider", async () => {
			const existingOrder = [{ id: "order-10", riderId: null }];
			const assignedOrder = [
				{ id: "order-10", riderId: "rider-abc", status: "assigned" },
			];

			// 1st selection check
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(existingOrder).then(onFulfilled)
			);
			// 2nd update execution
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(assignedOrder).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/riders/order-10/accept")
				.set("Authorization", "Bearer rider-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.order.status).toBe("assigned");
		});
	});

	describe("POST /api/v1/riders/:id/confirm", () => {
		it("should reject requests that omit the verification PIN code with 400", async () => {
			const response = await request(app)
				.post("/api/v1/riders/order-10/confirm")
				.set("Authorization", "Bearer rider-token")
				.send({});

			expect(response.status).toBe(400);
		});

		it("should return 400 when an invalid PIN is supplied", async () => {
			const activeOrder = [
				{ id: "order-10", deliveryPin: "1234", riderId: "rider-abc" },
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/riders/order-10/confirm")
				.set("Authorization", "Bearer rider-token")
				.send({ pin: "9999" }); // Wrong PIN

			expect(response.status).toBe(400);
			expect(response.body.message).toContain("Invalid delivery PIN");
		});

		it("should fulfill order and return 200 when correct pin code matches", async () => {
			const activeOrder = [
				{
					id: "order-10",
					deliveryPin: "1234",
					attendeeId: "user-xyz",
					riderId: "rider-abc",
				},
			];
			const deliveredOrder = [{ id: "order-10", status: "delivered" }];
			const attendeeProfile = [
				{
					id: "user-xyz",
					email: "test@user.com",
					fullName: "Test User",
				},
			];

			// 1. Ownership and PIN verification check
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);
			// 2. Status update execution
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(deliveredOrder).then(onFulfilled)
			);
			// 3. Background Email Dispatch Lookup
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(attendeeProfile).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/riders/order-10/confirm")
				.set("Authorization", "Bearer rider-token")
				.send({ pin: "1234" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.order.status).toBe("delivered");
		});
	});

	describe("POST /api/v1/riders/qr-confirm", () => {
		it("should fail if QR payload parameter string is absent", async () => {
			const response = await request(app)
				.post("/api/v1/riders/qr-confirm")
				.set("Authorization", "Bearer rider-token")
				.send({});

			expect(response.status).toBe(400);
		});

		it("should return 400 bad request if payload format cannot be parsed as JSON", async () => {
			const response = await request(app)
				.post("/api/v1/riders/qr-confirm")
				.set("Authorization", "Bearer rider-token")
				.send({ scannedPayload: "malformed-string-content-not-json" });

			expect(response.status).toBe(400);
			expect(response.body.message).toContain("Invalid QR code format");
		});

		it("should successfully deliver orders using valid structured payload objects", async () => {
			const validPayload = JSON.stringify({
				orderId: "order-20",
				pin: "5678",
			});
			const activeOrder = [
				{
					id: "order-20",
					deliveryPin: "5678",
					attendeeId: "user-xyz",
					riderId: "rider-abc",
				},
			];
			const deliveredOrder = [{ id: "order-20", status: "delivered" }];
			const attendeeProfile = [
				{
					id: "user-xyz",
					email: "test@user.com",
					fullName: "Test User",
				},
			];

			// 1. QR payload validation lookup
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);
			// 2. Delivery modification execution
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(deliveredOrder).then(onFulfilled)
			);
			// 3. Background Email dispatch lookup
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(attendeeProfile).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/riders/qr-confirm")
				.set("Authorization", "Bearer rider-token")
				.send({ scannedPayload: validPayload });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.order.status).toBe("delivered");
		});
	});
});
