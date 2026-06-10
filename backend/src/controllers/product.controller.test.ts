import { Response, Request } from "express";
import {
	createProduct,
	getProducts,
	updateProduct,
	deleteProduct,
} from "./product.controller";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Define the mock structure directly inside the factory block
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
		delete: jest.fn(),
		returning: jest.fn(),
	};
	return { db: mockChain };
});

// 2. Import the mocked db instance
import { db } from "../../db";
const mockDb = db as any;

describe("Product Controller", () => {
	let mockRequest: Partial<AuthenticatedRequest>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		jest.clearAllMocks();

		// 3. Robustly reset and re-establish the clean fluent builder chain before EVERY test
		mockDb.select.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.insert.mockReturnValue(mockDb);
		mockDb.values.mockReturnValue(mockDb);
		mockDb.update.mockReturnValue(mockDb);
		mockDb.set.mockReturnValue(mockDb);
		mockDb.delete.mockReturnValue(mockDb);

		// Reset terminal methods completely
		mockDb.limit.mockReset();
		mockDb.returning.mockReset();

		mockRequest = {
			body: {},
			params: {},
			user: {
				id: "vendor-456",
				email: "vendor@flowmart.com",
				role: "vendor",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	describe("createProduct", () => {
		it("should return 400 if product name or price is missing", async () => {
			mockRequest.body = {
				description: "Delicious snacks",
				stockQuantity: 10,
			};

			await createProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Name and price are required",
			});
		});

		it("should default stock to 0 if not provided and return 201 on success", async () => {
			mockRequest.body = { name: "Gala Sausage Roll", price: "250" };

			const mockNewProduct = {
				id: "prod-1",
				name: "Gala Sausage Roll",
				price: "250",
				stockQuantity: 0,
			};
			mockDb.returning.mockResolvedValue([mockNewProduct]);

			await createProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Gala Sausage Roll",
					price: "250",
					stockQuantity: 0,
					vendorId: "vendor-456",
				})
			);
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Product created",
				product: mockNewProduct,
			});
		});
	});

	describe("getProducts", () => {
		it("should return 200 with all available in-stock items", async () => {
			const mockInStockProducts = [
				{ id: "prod-1", name: "Product A", stockQuantity: 5 },
				{ id: "prod-2", name: "Product B", stockQuantity: 12 },
			];
			// Since .where() is the terminal method in getProducts, it's safe to resolve here
			mockDb.where.mockResolvedValue(mockInStockProducts);

			await getProducts(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				products: mockInStockProducts,
			});
		});
	});

	describe("updateProduct", () => {
		it("should return 404 if the product does not exist or does not belong to the vendor", async () => {
			mockRequest.params = { id: "not-your-product" };
			mockRequest.body = { name: "Updated Name" };

			mockDb.limit.mockResolvedValue([]); // No matching row found during lookup

			await updateProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Product not found or unauthorized",
			});
		});

		it("should merge modifications with existing values and return 200 on success", async () => {
			mockRequest.params = { id: "prod-123" };
			mockRequest.body = { stockQuantity: 50 };

			const mockExistingProduct = {
				id: "prod-123",
				name: "Old Name",
				price: "500",
				stockQuantity: 10,
				vendorId: "vendor-456",
			};
			const mockUpdatedProduct = {
				id: "prod-123",
				name: "Old Name",
				price: "500",
				stockQuantity: 50,
				vendorId: "vendor-456",
			};

			mockDb.limit.mockResolvedValue([mockExistingProduct]);
			mockDb.returning.mockResolvedValue([mockUpdatedProduct]);

			await updateProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "Old Name",
					stockQuantity: 50,
				})
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
		});
	});

	describe("deleteProduct", () => {
		it("should return 404 if trying to delete a non-existent or unauthorized product", async () => {
			mockRequest.params = { id: "ghost-product" };
			mockDb.returning.mockResolvedValue([]);

			await deleteProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: false,
				message: "Product not found or unauthorized",
			});
		});

		it("should return 200 when deletion criteria are satisfied", async () => {
			mockRequest.params = { id: "prod-123" };
			mockDb.returning.mockResolvedValue([{ id: "prod-123" }]);

			await deleteProduct(
				mockRequest as AuthenticatedRequest,
				mockResponse as Response
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Product deleted successfully",
			});
		});
	});
});
