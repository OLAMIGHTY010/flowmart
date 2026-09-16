import { Request, Response } from "express";
import { db } from "../../db";
import { products, vendorProfiles, users, vendorKyc, categories } from "../../db/schema";
import { eq, and, gt, sql, count } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Create a Product (Vendors Only)
export const createProduct = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const { name, description, price, stockQuantity, sku, categoryId, brand, oldPrice, weight, images, condition, isNegotiable } = req.body;
		const vendorId = req.user?.id;

		if (!name || !price) {
			return res.status(400).json({
				success: false,
				message: "Name and price are required",
			});
		}

		const [newProduct] = await db
			.insert(products)
			.values({
				vendorId: vendorId!,
				name,
				description,
				price,
				stockQuantity: stockQuantity || 0,
				sku,
				categoryId: categoryId || null,
				brand,
				oldPrice: oldPrice || null,
				weight: weight || null,
				images: Array.isArray(images) ? images.join(',') : (images || null),
				condition: condition || 'new',
				isNegotiable: isNegotiable || false,
				isSponsored: false,
			})
			.returning();

		return res.status(201).json({
			success: true,
			message: "Product created",
			product: newProduct,
		});
	} catch (error) {
		console.error("Create Product Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 2. Get All Available Products (For Customers) or Vendor's Products
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
	try {
        // Implement Standard Pagination 
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

		if (req.user?.role === 'vendor') {
			const vendorProductsRaw = await db
				.select({
					product: products,
					categoryName: categories.name,
				})
				.from(products)
				.leftJoin(categories, eq(products.categoryId, categories.id))
				.where(eq(products.vendorId, req.user.id))
				.orderBy(sql`${products.isSponsored} DESC`, sql`${products.createdAt} DESC`)
                .limit(limit)
                .offset(offset);
			
			const vendorProducts = vendorProductsRaw.map(r => ({
				...r.product,
				category: r.categoryName
			}));

			return res.status(200).json({ success: true, products: vendorProducts, meta: { page, limit } });
		}

		// Only fetch products where stockQuantity is greater than 0 to hide out-of-stock items
		const availableProductsRaw = await db
			.select({
				product: products,
				categoryName: categories.name,
			})
			.from(products)
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(gt(products.stockQuantity, 0))
			.orderBy(sql`${products.isSponsored} DESC`, sql`${products.createdAt} DESC`)
            .limit(limit)
            .offset(offset);

		const availableProducts = availableProductsRaw.map(r => ({
			...r.product,
			category: r.categoryName
		}));

		return res
			.status(200)
			.json({ success: true, products: availableProducts, meta: { page, limit } });
	} catch (error) {
		console.error("Get Products Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// Newly added endpoint directly answering frontend tracker 404 gap
export const getProductById = async (req: Request, res: Response) => {
	try {
		const raw = await db
			.select({
				product: products,
				categoryName: categories.name
			})
			.from(products)
			.leftJoin(categories, eq(products.categoryId, categories.id))
			.where(eq(products.id, req.params.id as string))
			.limit(1);

		if (!raw.length) return res.status(404).json({ success: false, message: "Product not found" });
		
		const product = { ...raw[0].product, category: raw[0].categoryName };
		return res.status(200).json({ success: true, product });
	} catch (error) {
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 3. Update Product & Inventory (Vendors Only)
export const updateProduct = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const productId = req.params.id as string;
		const vendorId = req.user?.id;
		const { name, description, price, stockQuantity, sku, categoryId, brand, oldPrice, weight, images } = req.body;

		// Verify the product belongs to the vendor requesting the update (Keeping type assertion)
		const [existingProduct] = await db
			.select()
			.from(products)
			.where(
				and(
					eq(products.id, productId as string),
					eq(products.vendorId, vendorId!)
				)
			)
			.limit(1);

		if (!existingProduct) {
			return res.status(404).json({
				success: false,
				message: "Product not found or unauthorized",
			});
		}

		const [updatedProduct] = await db
			.update(products)
			.set({
				name: name || existingProduct.name,
				description:
					description !== undefined
						? description
						: existingProduct.description,
				price: price || existingProduct.price,
				stockQuantity:
					stockQuantity !== undefined
						? stockQuantity
						: existingProduct.stockQuantity,

				sku: sku !== undefined ? sku : existingProduct.sku,
				categoryId: categoryId !== undefined ? categoryId : existingProduct.categoryId,
				brand: brand !== undefined ? brand : existingProduct.brand,
				oldPrice: oldPrice !== undefined ? oldPrice : existingProduct.oldPrice,
				weight: weight !== undefined ? weight : existingProduct.weight,
				images: images !== undefined 
					? (Array.isArray(images) ? images.join(',') : images) 
					: existingProduct.images,
				updatedAt: new Date(),
			})
			.where(eq(products.id, productId as string))
			.returning();

		return res.status(200).json({
			success: true,
			message: "Product updated",
			product: updatedProduct,
		});
	} catch (error) {
		console.error("Update Product Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 4. Delete a Product (Vendors Only)
export const deleteProduct = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const productId = req.params.id as string;
		const vendorId = req.user?.id;

		// Verify and drop the record safely
		const [deletedProduct] = await db
			.delete(products)
			.where(
				and(
					eq(products.id, productId as string),
					eq(products.vendorId, vendorId!)
				)
			)
			.returning();

		if (!deletedProduct) {
			return res.status(404).json({
				success: false,
				message: "Product not found or unauthorized",
			});
		}

		return res
			.status(200)
			.json({ success: true, message: "Product deleted successfully" });
	} catch (error) {
		console.error("Delete Product Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 5. Get Public Vendor Profile
export const getVendorPublicProfile = async (req: Request, res: Response) => {
	try {
		const vendorId = req.params.id as string;

		// Get user info
		const [user] = await db
			.select({
				id: users.id,
				fullName: users.fullName,
				email: users.email,
				isVerified: users.isVerified,
			})
			.from(users)
			.where(eq(users.id, vendorId))
			.limit(1);

		if (!user) {
			return res.status(404).json({ success: false, message: "Vendor not found" });
		}

		// Get vendor profile
		const [profile] = await db
			.select()
			.from(vendorProfiles)
			.where(eq(vendorProfiles.vendorId, vendorId))
			.limit(1);

		// Get product count
		const vendorProducts = await db
			.select()
			.from(products)
			.where(eq(products.vendorId, vendorId));

		const totalProducts = vendorProducts.length;

		return res.status(200).json({
			success: true,
			vendor: {
				id: user.id,
				name: profile?.displayName || user.fullName,
				businessName: profile?.businessName || null,
				logo: profile?.avatar || null,
				bio: profile?.bio || null,
				city: profile?.city || null,
				stateRegion: profile?.stateRegion || null,
				verified: user.isVerified,
				totalProducts,
			},
		});
	} catch (error) {
		console.error("Get Vendor Profile Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// (getCategories moved to category.controller.ts)
