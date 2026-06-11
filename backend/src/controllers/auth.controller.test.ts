import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { register, login } from "./auth.controller";
import { hashPassword, comparePassword } from "../utils/password";

// 1. Create mock chain spies for Drizzle ORM
const mockLimit = jest.fn();
const mockWhere = jest.fn().mockReturnThis(); // allows chaining .where().limit()
const mockFrom = jest.fn().mockReturnThis(); // allows chaining .from().where()
const mockSelect = jest.fn().mockImplementation(() => ({
	from: () => ({
		where: () => ({
			limit: mockLimit,
		}),
	}),
}));

const mockReturning = jest.fn();
const mockValues = jest.fn().mockImplementation(() => ({
	returning: mockReturning,
}));
const mockInsert = jest.fn().mockImplementation(() => ({
	values: mockValues,
}));

// 2. Mock external dependencies
jest.mock("../../db", () => ({
	db: {
		select: () => mockSelect(),
		insert: () => mockInsert(),
	},
}));

jest.mock("../utils/password", () => ({
	hashPassword: jest.fn(),
	comparePassword: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
	sign: jest.fn(),
}));

describe("Auth Controller", () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockRequest = { body: {} };
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		process.env.JWT_SECRET = "test-secret";
	});

	describe("register", () => {
		it("should return 400 if required fields are missing", async () => {
			mockRequest.body = { email: "test@example.com" }; // missing fullName and password

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "All fields are required",
			});
		});

		it("should return 400 if the email is already registered", async () => {
			mockRequest.body = {
				fullName: "John Doe",
				email: "existing@example.com",
				password: "password123",
			};

			// Simulate database finding an existing user record
			mockLimit.mockResolvedValue([{ id: "existing-id" }]);

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Email already registered",
			});
		});

		it("should register a new user successfully and return 201 with a token", async () => {
			mockRequest.body = {
				fullName: "New User",
				email: "new@example.com",
				password: "password123",
				role: "dispatch_rider",
			};

			mockLimit.mockResolvedValue([]); // No existing user found
			(hashPassword as jest.Mock).mockResolvedValue("hashed-password");

			const createdUser = {
				id: "new-id",
				fullName: "New User",
				email: "new@example.com",
				role: "dispatch_rider",
			};
			mockReturning.mockResolvedValue([createdUser]);
			(jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

			await register(mockRequest as Request, mockResponse as Response);

			expect(hashPassword).toHaveBeenCalledWith("password123");
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "User registered successfully",
				token: "mock-jwt-token",
				user: createdUser,
			});
		});

		it("should return 500 if an internal server error occurs", async () => {
			mockRequest.body = {
				fullName: "John",
				email: "error@example.com",
				password: "password",
			};
			mockLimit.mockRejectedValue(new Error("DB Connection Timeout"));

			// Suppress console.error inside tests to keep the terminal output clean
			jest.spyOn(console, "error").mockImplementation(() => {});

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Internal Server Error",
			});
		});
	});

	describe("login", () => {
		it("should return 400 if email or password are missing", async () => {
			mockRequest.body = { email: "login@example.com" }; // missing password

			await login(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Email and password required",
			});
		});

		it("should return 401 if user does not exist", async () => {
			mockRequest.body = {
				email: "notfound@example.com",
				password: "password123",
			};
			mockLimit.mockResolvedValue([]); // Empty array means user wasn't found

			await login(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Invalid credentials",
			});
		});

		it("should return 401 if the password check fails", async () => {
			mockRequest.body = {
				email: "user@example.com",
				password: "wrong-password",
			};

			const dbUser = {
				id: "user-id",
				email: "user@example.com",
				password: "hashed-password",
				role: "attendee",
			};
			mockLimit.mockResolvedValue([dbUser]);
			(comparePassword as jest.Mock).mockResolvedValue(false); // Invalid password match

			await login(mockRequest as Request, mockResponse as Response);

			expect(comparePassword).toHaveBeenCalledWith(
				"wrong-password",
				"hashed-password"
			);
			expect(mockResponse.status).toHaveBeenCalledWith(401);
		});

		it("should login successfully and return 200 with a validation token", async () => {
			mockRequest.body = {
				email: "rider@flowmart.com",
				password: "correct-password",
			};

			const dbUser = {
				id: "rider-1",
				fullName: "Rider One",
				email: "rider@flowmart.com",
				password: "hashed-password",
				role: "dispatch_rider",
			};
			mockLimit.mockResolvedValue([dbUser]);
			(comparePassword as jest.Mock).mockResolvedValue(true);
			(jwt.sign as jest.Mock).mockReturnValue("valid-login-token");

			await login(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Login successful",
				token: "valid-login-token",
				user: {
					id: "rider-1",
					fullName: "Rider One",
					email: "rider@flowmart.com",
					role: "dispatch_rider",
				},
			});
		});
	});
});
