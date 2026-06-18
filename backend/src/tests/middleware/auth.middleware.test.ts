import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
	authenticateJWT,
	authorizeRoles,
	AuthenticatedRequest,
} from "../../middleware/auth.middleware";

// 1. Tell Jest to replace the real 'jsonwebtoken' library with a fake one we can control
jest.mock("jsonwebtoken");

describe("Auth Middleware", () => {
	// Setup our fake Express objects
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		// Reset the fake objects before every single test
		mockRequest = {
			headers: {},
		};
		mockResponse = {
			// jest.fn() creates a "spy" function so we can check if it was called
			status: jest.fn().mockReturnThis(), // allows chaining like res.status().json()
			json: jest.fn(),
		};
		mockNext = jest.fn();

		// Provide a dummy secret for the environment variable
		process.env.JWT_SECRET = "super-secret-test-key";
	});

	describe("authenticateJWT", () => {
		it("should return 401 if no authorization header is present", () => {
			authenticateJWT(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Access token missing or invalid",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return 401 if the header does not start with "Bearer "', () => {
			mockRequest.headers = { authorization: "Basic some-token-here" };

			authenticateJWT(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should return 403 if the token is invalid or expired", () => {
			mockRequest.headers = { authorization: "Bearer bad-token" };
			// Force the fake jwt library to throw an error (simulating an expired token)
			(jwt.verify as jest.Mock).mockImplementation(() => {
				throw new Error("jwt expired");
			});

			authenticateJWT(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Invalid or expired token",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should attach the user payload to the request and call next() if token is valid", () => {
			const mockUserPayload = {
				id: "123",
				email: "test@test.com",
				role: "dispatch_rider",
			};
			mockRequest.headers = { authorization: "Bearer valid-token" };

			// Force the fake jwt library to return our mock user
			(jwt.verify as jest.Mock).mockReturnValue(mockUserPayload);

			authenticateJWT(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockRequest.user).toEqual(mockUserPayload);
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe("authorizeRoles", () => {
		it("should return 403 if no user is attached to the request", () => {
			// Simulate authenticateJWT failing or being bypassed
			const middleware = authorizeRoles("super_admin");

			middleware(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message:
					"Forbidden: You do not have permission to access this resource",
			});
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should return 403 if the user does not have the required role", () => {
			mockRequest.user = {
				id: "123",
				email: "test@test.com",
				role: "attendee",
			};
			const middleware = authorizeRoles(
				"camp_logistics_coordinator",
				"zone_coordinator"
			);

			middleware(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it("should call next() if the user has the required role", () => {
			mockRequest.user = {
				id: "123",
				email: "test@test.com",
				role: "zone_coordinator",
			};
			const middleware = authorizeRoles(
				"camp_logistics_coordinator",
				"zone_coordinator"
			);

			middleware(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalled();
			// Ensure we didn't accidentally send an error response
			expect(mockResponse.status).not.toHaveBeenCalled();
		});
	});
});
