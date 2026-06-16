import request from "supertest";
import express from "express";
import orderRouter from "../../routes/order.routes";

// 1. Database Fluent Chain Mock
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

// 2. Auth Middleware Mocking
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized" });
		}
		if (authHeader === "Bearer attendee-token") {
			req.user = { id: "attendee-111", role: "attendee" };
		} else if (authHeader === "Bearer vendor-token") {
			req.user = { id: "vendor-222", role: "vendor" };
		} else if (authHeader === "Bearer suspect-token") {
			req.user = { id: "intruder-333", role: "anonymous_role" };
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

// 3. Email Service Mocking
jest.mock("../services/email.service", () => ({
	emailService: {
		sendOrderReceiptEmail: jest.fn().mockResolvedValue(true),
		sendOutOfStockAlert: jest.fn().mockResolvedValue(true),
	},
}));

import { db } from "../../../db";
const mockDb = db as any;

const app = express();
app.use(express.json());
app.use("/api/v1/orders", orderRouter);

describe("Order Routing Layer - Integration Tests", () => {
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

	describe("POST /api/v1/orders", () => {
		it("should validate missing mandatory checkout details with 400", async () => {
			const response = await request(app)
				.post("/api/v1/orders")
				.set("Authorization", "Bearer attendee-token")
				.send({ productId: "p-1" }); // missing quantity, deliveryZone

			expect(response.status).toBe(400);
			expect(response.body.message).toContain(
				"Missing required order details"
			);
		});

		it("should block checkout if item inventory is completely exhausted", async () => {
			const mockProduct = [
				{
					id: "p-1",
					price: "150",
					stockQuantity: 2,
					vendorId: "vendor-222",
				},
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockProduct).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/orders")
				.set("Authorization", "Bearer attendee-token")
				.send({
					productId: "p-1",
					quantity: 5,
					deliveryZone: "Zone A",
				}); // 5 > 2 stock

			expect(response.status).toBe(400);
			expect(response.body.message).toContain(
				"unavailable or out of stock"
			);
		});

		it("should successfully place order, deduct stock, and return the plain order object", async () => {
			const mockProduct = [
				{
					id: "p-1",
					name: "Item Alpha",
					price: "100",
					stockQuantity: 10,
					vendorId: "vendor-222",
				},
			];
			const createdOrder = [
				{
					id: "order-999",
					totalAmount: "200",
					deliveryZone: "Zone A",
					status: "pending",
				},
			];
			const attendeeRecord = [
				{
					id: "attendee-111",
					email: "user@test.com",
					fullName: "User One",
				},
			];
			const vendorRecord = [
				{
					id: "vendor-222",
					email: "vendor@test.com",
					fullName: "Vendor One",
				},
			];

			// 1. Check Product selection
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockProduct).then(onFulfilled)
			);
			// 2. Order record insertion
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(createdOrder).then(onFulfilled)
			);
			// 3. Order item pivot insert (no returning array checked)
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);
			// 4. Update Product stock count
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);
			// 5. Concurrent user lookups (Attendee & Vendor)
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(attendeeRecord).then(onFulfilled)
			);
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(vendorRecord).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/orders")
				.set("Authorization", "Bearer attendee-token")
				.send({
					productId: "p-1",
					quantity: 2,
					deliveryZone: "Zone A",
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.order.status).toBe("pending"); // Notice: reading directly from object, no index arrays needed!
		});
	});

	describe("GET /api/v1/orders", () => {
		it("should fetch history records matching vendor constraints", async () => {
			const vendorOrders = [
				{ id: "order-100", vendorId: "vendor-222", totalAmount: "500" },
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(vendorOrders).then(onFulfilled)
			);

			const response = await request(app)
				.get("/api/v1/orders")
				.set("Authorization", "Bearer vendor-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.orders).toHaveLength(1);
		});

		it("should fetch history records matching attendee constraints", async () => {
			const attendeeOrders = [
				{
					id: "order-200",
					attendeeId: "attendee-111",
					totalAmount: "120",
				},
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(attendeeOrders).then(onFulfilled)
			);

			const response = await request(app)
				.get("/api/v1/orders")
				.set("Authorization", "Bearer attendee-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.orders).toHaveLength(1);
		});

		it("should return 403 if the user role is unrecognized", async () => {
			const response = await request(app)
				.get("/api/v1/orders")
				.set("Authorization", "Bearer suspect-token");

			expect(response.status).toBe(403);
		});
	});

	describe("PATCH /api/v1/orders/:id/status", () => {
		it("should respond with 404 if the order does not exist or isn't owned by the vendor", async () => {
			// Owner validation check returns empty
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);

			const response = await request(app)
				.patch("/api/v1/orders/order-missing/status")
				.set("Authorization", "Bearer vendor-token")
				.send({ status: "confirmed" });

			expect(response.status).toBe(404);
		});

		it("should successfully update and return the updated plain order item status structure", async () => {
			const activeOrder = [
				{ id: "order-50", vendorId: "vendor-222", status: "pending" },
			];
			const updatedOrder = [
				{ id: "order-50", vendorId: "vendor-222", status: "confirmed" },
			];

			// 1. Initial selection lookup confirmation
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);
			// 2. Status modifier database execution
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(updatedOrder).then(onFulfilled)
			);

			const response = await request(app)
				.patch("/api/v1/orders/order-50/status")
				.set("Authorization", "Bearer vendor-token")
				.send({ status: "confirmed" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.order.status).toBe("confirmed"); // Targets object properties cleanly
		});
	});
});
