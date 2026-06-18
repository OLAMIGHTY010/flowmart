import request from "supertest";
import express from "express";
import syncRouter from "../../routes/sync.routes";

// 1. Mock the Database Fluent Chain
jest.mock("../../db", () => {
	const chain = {
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		then: jest.fn(),
	};
	return { db: chain };
});

// 2. Mock JWT Auth Middleware
jest.mock("../middleware/auth.middleware", () => ({
	authenticateJWT: (req: any, res: any, next: any) => {
		req.user = { id: "rider-777", role: "dispatch_rider" };
		next();
	},
}));

// 3. Mock WebSocket live notifications
jest.mock("../services/websocket", () => ({
	sendInAppNotification: jest.fn().mockReturnValue(true),
}));

import { db } from "../../../db";
import { sendInAppNotification } from "../../services/websocket";
const mockDb = db as any;
const mockSendInAppNotification = sendInAppNotification as jest.Mock;

const app = express();
app.use(express.json());
app.use("/api/v1/sync", syncRouter);

describe("Offline Synchronization Routing Layer - Integration Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockDb.select.mockReturnThis();
		mockDb.from.mockReturnThis();
		mockDb.where.mockReturnThis();
		mockDb.limit.mockReturnThis();
		mockDb.update.mockReturnThis();
		mockDb.set.mockReturnThis();
	});

	describe("POST /api/v1/sync", () => {
		it("should process a valid confirm_delivery queue action and push a live notification", async () => {
			const activeOrder = [
				{
					id: "order-abc",
					deliveryPin: "999888",
					attendeeId: "user-321",
				},
			];

			// 1. Database Select Mock finding the matching order
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);
			// 2. Database Update Mock saving the 'delivered' status change
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve([]).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/sync")
				.send({
					actions: [
						{
							type: "confirm_delivery",
							payload: { orderId: "order-abc", pin: "999888" },
						},
					],
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe("Queues flushed");
			expect(response.body.results[0]).toEqual({
				orderId: "order-abc",
				status: "success",
			});

			// Verify WebSocket notification was dispatched to the attendee
			expect(mockSendInAppNotification).toHaveBeenCalledWith(
				"user-321",
				"order.delivered",
				{ orderId: "order-abc" }
			);
		});

		it("should report a sync failure if the scanned delivery PIN is incorrect", async () => {
			const activeOrder = [
				{
					id: "order-xyz",
					deliveryPin: "111222",
					attendeeId: "user-321",
				},
			];

			// Database select yields the record but the PIN in payload ('000000') will conflict
			mockDb.then.mockImplementationOnce((onFulfilled: any) =>
				Promise.resolve(activeOrder).then(onFulfilled)
			);

			const response = await request(app)
				.post("/api/v1/sync")
				.send({
					actions: [
						{
							type: "confirm_delivery",
							payload: { orderId: "order-xyz", pin: "000000" }, // Incorrect PIN
						},
					],
				});

			expect(response.status).toBe(200);
			expect(response.body.results[0]).toEqual({
				orderId: "order-xyz",
				status: "failed",
				reason: "Invalid PIN",
			});
			// Ensure WebSocket notification was not fired
			expect(mockSendInAppNotification).not.toHaveBeenCalled();
		});

		it("should smoothly drop out with a 500 status if loop evaluation errors out", async () => {
			// Force database selection loop to reject violently
			mockDb.then.mockImplementationOnce(
				(onFulfilled: any, onRejected: any) =>
					Promise.reject(new Error("Database Down")).catch(onRejected)
			);

			const response = await request(app)
				.post("/api/v1/sync")
				.send({
					actions: [
						{
							type: "confirm_delivery",
							payload: { orderId: "order-crash", pin: "123456" },
						},
					],
				});

			expect(response.status).toBe(500);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe("Sync processing failed");
		});
	});
});
