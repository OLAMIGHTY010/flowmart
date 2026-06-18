import request from "supertest";
import express from "express";
import productRouter from "../../routes/product.routes";

// 1. Database Mock Layer with fluent-chaining support
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
		delete: jest.fn().mockReturnThis(),
		returning: jest.fn().mockReturnThis(),
		then: jest.fn(),
	};
	return { db: chain };
});

// 2. Control Middleware Mocking to safely mimic authentication status and roles
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) {
			return res
				.status(401)
				.json({ success: false, message: "Unauthorized" });
		}
		if (authHeader === "Bearer vendor-token") {
			req.user = { id: "vendor-123", role: "vendor" };
		} else if (authHeader === "Bearer attendee-token") {
			req.user = { id: "attendee-456", role: "attendee" };
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
app.use("/api/v1/products", productRouter);

describe("Product API Layer - Integration Tests", () => {
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
		mockDb.delete.mockReturnThis();
		mockDb.returning.mockReturnThis();
	});

	describe("GET /api/v1/products", () => {
		it("should block unauthenticated requests with a 401", async () => {
			const response = await request(app).get("/api/v1/products");
			expect(response.status).toBe(401);
		});

		it("should return all items currently in stock for any logged-in user", async () => {
			const mockInventory = [
				{
					id: "p1",
					name: "Product 1",
					stockQuantity: 10,
					price: "100",
				},
				{ id: "p2", name: "Product 2", stockQuantity: 5, price: "200" },
			];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(mockInventory).then(onFulfilled)
			);

			const response = await request(app)
				.get("/api/v1/products")
				.set("Authorization", "Bearer attendee-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.products).toHaveLength(2);
		});
	});

	describe("POST /api/v1/products", () => {
		it("should reject non-vendor roles (like attendee) with a 403 Forbidden", async () => {
			const response = await request(app)
				.post("/api/v1/products")
				.set("Authorization", "Bearer attendee-token")
				.send({ name: "Contraband", price: "500" });

			expect(response.status).toBe(403);
		});

		it("should fail with a 400 bad request if mandatory fields are missing", async () => {
			const response = await request(app)
				.post("/api/v1/products")
				.set("Authorization", "Bearer vendor-token")
				.send({ description: "No Name Or Price Supplied" });

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should successfully create a product listing for a validated vendor", async () => {
			const newProductPayload = {
				id: "p-new",
				name: "Apple Watch",
				price: "399",
				vendorId: "vendor-123",
			};
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([newProductPayload]).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/products")
				.set("Authorization", "Bearer vendor-token")
				.send({ name: "Apple Watch", price: "399", stockQuantity: 15 });

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.product.name).toBe("Apple Watch");
		});
	});

	describe("PUT /api/v1/products/:id", () => {
		it("should return a 404/unauthorized status if the product is not owned by the requesting vendor", async () => {
			// Simulate empty return from ownership check select query
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);

			const response = await request(app)
				.put("/api/v1/products/p-someone-elses")
				.set("Authorization", "Bearer vendor-token")
				.send({ price: "150" });

			expect(response.status).toBe(404);
			expect(response.body.message).toContain(
				"Product not found or unauthorized"
			);
		});

		it("should safely update item changes if ownership passes verification checks", async () => {
			const currentRecord = [
				{ id: "p123", name: "Old Name", vendorId: "vendor-123" },
			];
			const updatedRecord = [
				{ id: "p123", name: "Brand New Name", vendorId: "vendor-123" },
			];

			// 1st call: verify owner select
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(currentRecord).then(onFulfilled)
			);
			// 2nd call: perform update execution
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(updatedRecord).then(onFulfilled)
			);

			const response = await request(app)
				.put("/api/v1/products/p123")
				.set("Authorization", "Bearer vendor-token")
				.send({ name: "Brand New Name" });

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.product.name).toBe("Brand New Name");
		});
	});

	describe("DELETE /api/v1/products/:id", () => {
		it("should give 404 back if the target product does not exist to drop", async () => {
			// Delete query targets item but returns an empty array (nothing deleted)
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);

			const response = await request(app)
				.delete("/api/v1/products/p-ghost")
				.set("Authorization", "Bearer vendor-token");

			expect(response.status).toBe(404);
		});

		it("should drop records cleanly when matching target conditions", async () => {
			const dummyDeletedItem = [{ id: "p123", name: "Item To Clear" }];
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(dummyDeletedItem).then(onFulfilled)
			);

			const response = await request(app)
				.delete("/api/v1/products/p123")
				.set("Authorization", "Bearer vendor-token");

			expect(response.status).toBe(200);
			expect(response.body.message).toContain(
				"Product deleted successfully"
			);
		});
	});
});
