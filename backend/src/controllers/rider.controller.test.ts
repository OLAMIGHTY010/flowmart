import { Response, Request } from "express";
import {
	getAvailableDeliveries,
	acceptDelivery,
	confirmDeliveryViaQR,
} from "./rider.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Mock the database layout directly in the factory block
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
		where: jest.fn(),
		limit: jest.fn(),
		update: jest.fn(),
		set: jest.fn(),
		returning: jest.fn(),
	};
	return { db: mockChain };
});

import { db } from "../../db";
const mockDb = db as any;

describe("Rider Controller", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Re-establish the clean query builder chain before every single test execution
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.update.mockReturnValue(mockDb);
		mockDb.set.mockReturnValue(mockDb);

		// Reset terminal chain methods
		mockDb.limit.mockReset();
		mockDb.returning.mockReset();

		mockRequest = {
			params: {},
			body: {},
			// FIXED HERE: changed "rider" to "dispatch_rider" to match your system roles
			user: {
				id: "rider-789",
				email: "rider@flowmart.com",
				role: "dispatch_rider",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("getAvailableDeliveries", () => {
		it("should return 200 with all confirmed, unassigned orders", async () => {
			const mockAvailableOrders = [
				{
					id: "order-1",
					status: "confirmed",
					deliveryZone: "Zone A",
					riderId: null,
				},
				{
					id: "order-2",
					status: "confirmed",
					deliveryZone: "Zone C",
					riderId: null,
				},
			];
			mockDb.where.mockResolvedValue(mockAvailableOrders);

			await getAvailableDeliveries(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				deliveries: mockAvailableOrders,
			});
		});

		it("should catch database exceptions and respond with a 500 error code", async () => {
			mockDb.where.mockRejectedValue(
				new Error("Connection termination drop")
			);

			await getAvailableDeliveries(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Internal Server Error",
			});
		});
	});

	describe("acceptDelivery", () => {
		it("should return 400 if the order is already accepted by another rider or does not exist", async () => {
			mockRequest.params = { id: "already-taken-or-expired" };
			mockDb.limit.mockResolvedValue([]); // Emulates zero matching rows found

			await acceptDelivery(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					success: false,
				})
			);
		});

		it("should assign the current rider ID to the order and return a 200 success response", async () => {
			mockRequest.params = { id: "order-100" };

			const mockExistingOrder = {
				id: "order-100",
				status: "confirmed",
				riderId: null,
			};
			const mockAssignedOrder = {
				id: "order-100",
				status: "confirmed",
				riderId: "rider-789",
			};

			mockDb.limit.mockResolvedValue([mockExistingOrder]);
			mockDb.returning.mockResolvedValue([mockAssignedOrder]);

			await acceptDelivery(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(200);
		});
	});

	describe("confirmDeliveryViaQR", () => {
		it("should return 400 if the scannedPayload is completely missing", async () => {
			mockRequest.body = {}; // empty body

			await confirmDeliveryViaQR(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Missing QR payload",
			});
		});

		it("should return 400 if the scannedPayload contains corrupted non-JSON strings", async () => {
			mockRequest.body = {
				scannedPayload: "this-is-not-valid-json-data-structure",
			};

			await confirmDeliveryViaQR(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Invalid QR code format",
			});
		});

		it("should return 400 if the order verification lookup fails or the PIN does not match", async () => {
			const badPayload = JSON.stringify({
				orderId: "order-555",
				pin: "000000",
			});
			mockRequest.body = { scannedPayload: badPayload };

			mockDb.limit.mockResolvedValue([]); // Order not found assigned to this rider

			await confirmDeliveryViaQR(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Invalid QR Code or Order not assigned to you",
			});
		});

		it("should return 200, advance status to delivered, and complete assignment on successful validation", async () => {
			const validPayload = JSON.stringify({
				orderId: "order-777",
				pin: "123456",
			});
			mockRequest.body = { scannedPayload: validPayload };

			const mockActiveOrder = {
				id: "order-777",
				riderId: "rider-789",
				deliveryPin: "123456",
				status: "confirmed",
			};
			const mockDeliveredOrder = {
				id: "order-777",
				riderId: "rider-789",
				status: "delivered",
			};

			mockDb.limit.mockResolvedValue([mockActiveOrder]);
			mockDb.returning.mockResolvedValue([mockDeliveredOrder]);

			await confirmDeliveryViaQR(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "delivered",
				})
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
		});
	});
});
