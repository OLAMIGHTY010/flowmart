import { Request, Response } from "express";
import { getUserDashboardStats } from "../../controllers/analytics.controller";

// 1. Mock the database fluent layout
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
	};
	return { db: mockChain };
});

import { db } from "../../../db";
const mockDb = db as any;

describe("Analytics Controller", () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// 2. Wire up the select chain wrapper return value
		mockDb.select.mockReturnValue(mockDb);

		// We clear the .from implementation specifically to allow predictable sequential mocking
		mockDb.from.mockReset();

		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("getUserDashboardStats", () => {
		it("should successfully compute order and welfare stats, returning 200", async () => {
			const mockOrderData = { totalOrders: 150, deliveredOrders: 120 };
			const mockWelfareData = {
				totalAllocated: 1000,
				totalDistributed: 950,
				totalShortages: 10,
			};

			// 3. Mock consecutive returns for the two separate .from() calls executed in the handler
			mockDb.from
				.mockResolvedValueOnce([mockOrderData]) // First call: from(orders)
				.mockResolvedValueOnce([mockWelfareData]); // Second call: from(welfareAllocations)

			await getUserDashboardStats(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockDb.select).toHaveBeenCalledTimes(2);
			expect(mockDb.from).toHaveBeenCalledTimes(2);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				stats: {
					commerce: mockOrderData,
					welfare: mockWelfareData,
				},
			});
		});

		it("should catch query execution errors and reply with a 500 status code", async () => {
			// Trigger a raw rejection on the very first query execution
			mockDb.from.mockRejectedValue(
				new Error("Complex aggregation query parsing breakdown")
			);

			await getUserDashboardStats(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Failed to fetch analytics",
			});
		});
	});
});
