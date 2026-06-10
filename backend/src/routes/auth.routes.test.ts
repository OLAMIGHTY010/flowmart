import request from "supertest";
import { app } from "../index"; // Imports your configured Express instance

// Mock the database layer entirely to isolate route parsing from live DB state
jest.mock("../../db", () => {
	const mockChain = {
		select: jest.fn(),
		from: jest.fn(),
		where: jest.fn(),
		limit: jest.fn(),
		insert: jest.fn(),
		values: jest.fn(),
		returning: jest.fn(),
	};
	return {
		db: mockChain,
		testDatabaseConnection: jest.fn().mockResolvedValue(true),
	};
});

import { db } from "../../db";
const mockDb = db as any;

describe("Auth Routing & API Surface Integration", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Re-wire standard fluent chain defaults
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.insert.mockReturnValue(mockDb);
		mockDb.values.mockReturnValue(mockDb);

		mockDb.limit.mockReset();
		mockDb.returning.mockReset();
	});

	describe("POST /api/v1/auth/register", () => {
		it("should pass data through routing/controllers and return 201 on success", async () => {
			// Simulate that the email is not taken yet (empty array from lookup)
			mockDb.limit.mockResolvedValue([]);

			// Simulate successful record creation returning the new user
			const mockCreatedUser = {
				id: "usr-abc",
				email: "integration@flowmart.com",
				role: "attendee",
			};
			mockDb.returning.mockResolvedValue([mockCreatedUser]);

			// Execute a real simulated HTTP POST request
			const response = await request(app)
				.post("/api/v1/auth/register")
				.send({
					fullName: "Integration Tester",
					email: "integration@flowmart.com",
					password: "SecurePassword123",
					role: "attendee",
				});

			// Assert full API surface response parameters
			expect(response.status).toBe(201);
			expect(response.headers["content-type"]).toContain(
				"application/json"
			);
			expect(response.body).toEqual({
				success: true,
				user: mockCreatedUser,
			});
		});

		it("should return 400 bad request if the email is already registered", async () => {
			// Simulate that a user with this email already exists
			mockDb.limit.mockResolvedValue([
				{ id: "existing-id", email: "taken@flowmart.com" },
			]);

			const response = await request(app)
				.post("/api/v1/auth/register")
				.send({
					fullName: "Duplicate User",
					email: "taken@flowmart.com",
					password: "Password123",
					role: "attendee",
				});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toContain("User already exists");
		});
	});

	describe("POST /api/v1/auth/login", () => {
		it("should return 401 unauthorized if user registration records are not found", async () => {
			// Simulate no user match found in DB
			mockDb.limit.mockResolvedValue([]);

			const response = await request(app)
				.post("/api/v1/auth/login")
				.send({
					email: "missing@flowmart.com",
					password: "SomePassword",
				});

			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});
});
