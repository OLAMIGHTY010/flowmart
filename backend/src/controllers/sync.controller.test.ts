import { Response } from "express";
import { processSyncQueue } from "./sync.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Mock the database fluent-chain layout inside its factory block
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
		where: jest.fn(),
		limit: jest.fn(),
		update: jest.fn(),
		set: jest.fn(),
	};
	return { db: mockChain };
});

// 2. Mock the websocket service module
jest.mock("../services/websocket", () => ({
	sendInAppNotification: jest.fn(),
}));

import { db } from "../../db";
import { sendInAppNotification } from "../services/websocket";

const mockDb = db as any;
const mockSendNotification = sendInAppNotification as jest.Mock;

describe("Sync Controller", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Re-establish fluent query builder chain mocks
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.update.mockReturnValue(mockDb);
		mockDb.set.mockReturnValue(mockDb);

		mockDb.limit.mockReset();

		mockRequest = {
			body: {},
			user: {
				id: "rider-123",
				email: "rider@flowmart.com",
				role: "dispatch_rider",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("processSyncQueue", () => {
		it("should handle an empty action queue gracefully and return 200", async () => {
			mockRequest.body = { actions: [] };

			await processSyncQueue(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Queues flushed",
				results: [],
			});
		});

		it("should ignore unrecognized action types and leave the results block unpopulated", async () => {
			mockRequest.body = {
				actions: [{ type: "unsupported_action_type", payload: {} }],
			};

			await processSyncQueue(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Queues flushed",
				results: [],
			});
		});

		it("should return failed status in the results array if the delivery PIN doesn't match", async () => {
			mockRequest.body = {
				actions: [
					{
						type: "confirm_delivery",
						payload: { orderId: "order-111", pin: "000000" }, // Incorrect PIN
					},
				],
			};

			const mockActiveOrder = {
				id: "order-111",
				deliveryPin: "123456",
				attendeeId: "user-777",
			};
			mockDb.limit.mockResolvedValue([mockActiveOrder]);

			await processSyncQueue(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Queues flushed",
				results: [
					{
						orderId: "order-111",
						status: "failed",
						reason: "Invalid PIN",
					},
				],
			});
			expect(mockDb.update).not.toHaveBeenCalled();
			expect(mockSendNotification).not.toHaveBeenCalled();
		});

		it("should process a valid delivery action, update the status, and fire an in-app notification", async () => {
			mockRequest.body = {
				actions: [
					{
						type: "confirm_delivery",
						payload: { orderId: "order-222", pin: "123456" }, // Matching PIN
					},
				],
			};

			const mockActiveOrder = {
				id: "order-222",
				deliveryPin: "123456",
				attendeeId: "user-888",
			};
			mockDb.limit.mockResolvedValue([mockActiveOrder]);

			await processSyncQueue(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "delivered",
				})
			);
			expect(mockSendNotification).toHaveBeenCalledWith(
				"user-888",
				"order.delivered",
				{ orderId: "order-222" }
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Queues flushed",
				results: [{ orderId: "order-222", status: "success" }],
			});
		});

		it("should return 500 status payload if a processing runtime error triggers", async () => {
			mockRequest.body = {
				actions: [
					{
						type: "confirm_delivery",
						payload: { orderId: "order-x" },
					},
				],
			};
			mockDb.limit.mockRejectedValue(
				new Error("Connection failure to redis/db queue cluster")
			);

			await processSyncQueue(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Sync processing failed",
			});
		});
	});
});
