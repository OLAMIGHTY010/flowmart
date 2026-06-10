import { Response } from "express";
import { placeOrder, getOrders, updateOrderStatus } from "./order.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Mock the database fluent-chain layout directly inside its factory block
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
		where: jest.fn(),
		limit: jest.fn(),
		insert: jest.fn(),
		values: jest.fn(),
		update: jest.fn(),
		set: jest.fn(),
		returning: jest.fn(),
	};
	return { db: mockChain };
});

import { db } from "../../db";
const mockDb = db as any;

describe("Order Controller", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// 2. Setup the fluent builder pattern returns for every isolated test execution
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.insert.mockReturnValue(mockDb);
		mockDb.values.mockReturnValue(mockDb);
		mockDb.update.mockReturnValue(mockDb);
		mockDb.set.mockReturnValue(mockDb);

		// Reset terminal chain methods
		mockDb.limit.mockReset();
		mockDb.returning.mockReset();

		mockRequest = {
			body: {},
			params: {},
			user: {
				id: "user-123",
				email: "test@flowmart.com",
				role: "attendee",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("placeOrder", () => {
		it("should return 400 if any required fields are missing", async () => {
			mockRequest.body = { productId: "prod-1", quantity: 2 }; // missing deliveryZone

			await placeOrder(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Missing required order details",
			});
		});

		it("should return 400 if product does not exist or has insufficient stock", async () => {
			mockRequest.body = {
				productId: "prod-out",
				quantity: 5,
				deliveryZone: "Zone B",
			};

			// Simulate product found but only 2 items left in stock
			const mockProduct = {
				id: "prod-out",
				stockQuantity: 2,
				price: "1500",
				vendorId: "vendor-xyz",
			};
			mockDb.limit.mockResolvedValue([mockProduct]);

			await placeOrder(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Product is unavailable or out of stock",
			});
		});

		it("should successfully calculate total, create order items, deduct inventory, and return 201", async () => {
			mockRequest.body = {
				productId: "prod-99",
				quantity: 2,
				deliveryZone: "Zone A",
			};

			const mockProduct = {
				id: "prod-99",
				stockQuantity: 10,
				price: "2000",
				vendorId: "vendor-789",
			};
			mockDb.limit.mockResolvedValue([mockProduct]);

			const mockCreatedOrder = {
				id: "order-111",
				attendeeId: "user-123",
				totalAmount: "4000",
				status: "pending",
			};
			mockDb.returning.mockResolvedValue([mockCreatedOrder]);

			await placeOrder(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			// Verify DB interaction steps for checkout workflow
			expect(mockDb.insert).toHaveBeenCalledTimes(2); // 1 for order, 1 for order items
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything()); // inventory adjustment
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Order placed successfully",
				order: mockCreatedOrder,
			});
		});

		it("should handle runtime exceptions and respond with a 500 structure", async () => {
			mockRequest.body = {
				productId: "prod-99",
				quantity: 1,
				deliveryZone: "Zone A",
			};
			mockDb.limit.mockRejectedValue(
				new Error("Write replica error connection failure")
			);

			await placeOrder(
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

	describe("getOrders", () => {
		it("should fetch history filtering by vendorId if user role is vendor", async () => {
			mockRequest.user = {
				id: "vendor-55",
				email: "shop@flowmart.com",
				role: "vendor",
			};

			const mockVendorOrders = [
				{ id: "order-1", vendorId: "vendor-55", totalAmount: "5000" },
			];
			mockDb.where.mockResolvedValue(mockVendorOrders);

			await getOrders(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.where).toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				orders: mockVendorOrders,
			});
		});

		it("should fetch history filtering by attendeeId if user role is attendee", async () => {
			mockRequest.user = {
				id: "attendee-22",
				email: "buyer@flowmart.com",
				role: "attendee",
			};

			const mockAttendeeOrders = [
				{
					id: "order-2",
					attendeeId: "attendee-22",
					totalAmount: "3000",
				},
			];
			mockDb.where.mockResolvedValue(mockAttendeeOrders);

			await getOrders(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.where).toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				orders: mockAttendeeOrders,
			});
		});

		it("should block query and return 403 if user role is unrecognized", async () => {
			mockRequest.user = {
				id: "admin-99",
				email: "admin@flowmart.com",
				role: "super_admin" as any,
			};

			await getOrders(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Unauthorized view",
			});
		});
	});

	describe("updateOrderStatus", () => {
		it("should return 404 if order does not exist or does not belong to the calling vendor", async () => {
			mockRequest.params = { id: "order-not-mine" };
			mockRequest.body = { status: "confirmed" };
			mockRequest.user = {
				id: "vendor-wrong",
				email: "vendor@flowmart.com",
				role: "vendor",
			};

			mockDb.limit.mockResolvedValue([]); // No matching rows found for verification check

			await updateOrderStatus(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Order not found or unauthorized",
			});
		});

		it("should update status and return 200 when execution conditions match successfully", async () => {
			mockRequest.params = { id: "order-456" };
			mockRequest.body = { status: "confirmed" };
			mockRequest.user = {
				id: "vendor-correct",
				email: "vendor@flowmart.com",
				role: "vendor",
			};

			const mockExistingOrder = {
				id: "order-456",
				vendorId: "vendor-correct",
				status: "pending",
			};
			const mockUpdatedOrder = {
				id: "order-456",
				vendorId: "vendor-correct",
				status: "confirmed",
			};

			mockDb.limit.mockResolvedValue([mockExistingOrder]);
			mockDb.returning.mockResolvedValue([mockUpdatedOrder]);

			await updateOrderStatus(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "confirmed",
				})
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Order marked as confirmed",
				order: mockUpdatedOrder,
			});
		});
	});
});
