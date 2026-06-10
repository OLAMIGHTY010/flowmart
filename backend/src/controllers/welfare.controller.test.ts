import { Request, Response } from "express";
import {
	createWelfareEvent,
	allocateWelfare,
	getWelfareReports,
} from "./welfare.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Mock the database fluent-chain layout inside its factory block
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
		insert: jest.fn(),
		values: jest.fn(),
		returning: jest.fn(),
	};
	return { db: mockChain };
});

import { db } from "../../db";
const mockDb = db as any;

describe("Welfare Controller", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// 2. Wire up the fluent builder mocks for every clean test pass
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.insert.mockReturnValue(mockDb);
		mockDb.values.mockReturnValue(mockDb);

		mockDb.returning.mockReset();

		mockRequest = {
			body: {},
			user: {
				id: "welfare-coord-123",
				email: "welfare@flowmart.com",
				role: "camp_logistics_coordinator",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("createWelfareEvent", () => {
		it("should successfully create a welfare event and return 201", async () => {
			mockRequest.body = {
				name: "Ramadan Package Distribution",
				date: "2026-06-15",
			};

			const mockCreatedEvent = {
				id: "event-001",
				name: "Ramadan Package Distribution",
				date: new Date("2026-06-15"),
				createdBy: "welfare-coord-123",
			};
			mockDb.returning.mockResolvedValue([mockCreatedEvent]);

			await createWelfareEvent(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Ramadan Package Distribution",
					createdBy: "welfare-coord-123",
				})
			);
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				event: mockCreatedEvent,
			});
		});

		it('should catch runtime errors and return a 500 status with "Server Error"', async () => {
			mockRequest.body = { name: "Faulty Event", date: "2026-06-15" };
			mockDb.returning.mockRejectedValue(
				new Error("Database unique constraint violation")
			);

			await createWelfareEvent(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Server Error",
			});
		});
	});

	describe("allocateWelfare", () => {
		it("should successfully log a zone allocation record and return 201", async () => {
			mockRequest.body = {
				eventId: "event-001",
				zoneId: "zone-north",
				totalItems: 250,
			};

			const mockAllocation = {
				id: "alloc-99",
				eventId: "event-001",
				zoneId: "zone-north",
				totalItems: 250,
			};
			mockDb.returning.mockResolvedValue([mockAllocation]);

			await allocateWelfare(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith({
				eventId: "event-001",
				zoneId: "zone-north",
				totalItems: 250,
			});
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				allocation: mockAllocation,
			});
		});

		it("should catch database dropouts during allocation and return 500", async () => {
			mockRequest.body = {
				eventId: "event-001",
				zoneId: "zone-south",
				totalItems: 100,
			};
			mockDb.returning.mockRejectedValue(
				new Error("Pool connection timeout")
			);

			await allocateWelfare(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Server Error",
			});
		});
	});

	describe("getWelfareReports", () => {
		it("should query all allocation records and return them with a 200 status code", async () => {
			const mockReports = [
				{
					id: "alloc-1",
					eventId: "event-1",
					zoneId: "zone-a",
					totalItems: 150,
				},
				{
					id: "alloc-2",
					eventId: "event-1",
					zoneId: "zone-b",
					totalItems: 300,
				},
			];
			mockDb.from.mockResolvedValue(mockReports);

			await getWelfareReports(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				reports: mockReports,
			});
		});

		it("should safely reply with a 500 payload if the report collection fails", async () => {
			mockDb.from.mockRejectedValue(
				new Error("Table permissions read restriction")
			);

			await getWelfareReports(
				mockRequest as Request,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Server Error",
			});
		});
	});
});
