import { Request, Response } from "express";
import { db } from "../../db";
import { products, vendorProfiles, users, vendorKyc } from "../../db/schema";
import { eq, and, gt, sql, count } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. Create a Product (Vendors Only)
export const createProduct = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const { name, description, price, stockQuantity, sku, category, subCategory, brand, oldPrice, weight, images } = req.body;
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
				category,
				subCategory,
				brand,
				oldPrice: oldPrice || null,
				weight: weight || null,
				images: Array.isArray(images) ? images.join(',') : (images || null),
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

// 2. Get All Available Products (Public browsing) or Vendor's Own Products
export const getProducts = async (req: Request, res: Response) => {
	try {
        // Implement Standard Pagination 
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        const category = req.query.category as string | undefined;
        const subCategory = req.query.subCategory as string | undefined;
        const search = req.query.search as string | undefined;

        // Check if authenticated vendor wants their own products
        const authReq = req as AuthenticatedRequest;
		if (authReq.user?.role === 'vendor') {
			const vendorProducts = await db
				.select()
				.from(products)
				.where(eq(products.vendorId, authReq.user.id))
                .limit(limit)
                .offset(offset);
			return res.status(200).json({ success: true, products: vendorProducts, meta: { page, limit } });
		}

		// Public browsing — only in-stock items
        const conditions = [gt(products.stockQuantity, 0)];
        if (category && category !== 'All') {
            conditions.push(eq(products.category, category) as any);
        }
        if (subCategory && subCategory !== 'All') {
            conditions.push(eq(products.subCategory, subCategory) as any);
        }
        if (search) {
            conditions.push(sql`LOWER(${products.name}) LIKE ${`%${search.toLowerCase()}%`}` as any);
        }

		const availableProducts = await db
			.select()
			.from(products)
			.where(and(...conditions))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const [{ total }] = await db.select({ total: count() }).from(products).where(and(...conditions));

		return res
			.status(200)
			.json({ success: true, products: availableProducts, meta: { page, limit, total } });
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
		const [product] = await db.select().from(products).where(eq(products.id, req.params.id as string)).limit(1);
		if (!product) return res.status(404).json({ success: false, message: "Product not found" });
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
		const { name, description, price, stockQuantity, sku, category, subCategory, brand, oldPrice, weight, images } = req.body;

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
				category: category !== undefined ? category : existingProduct.category,
				subCategory: subCategory !== undefined ? subCategory : existingProduct.subCategory,
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

// 6. Get all product categories
export const getCategories = async (_req: Request, res: Response) => {
	try {
		const result = await db
			.selectDistinct({ category: products.category })
			.from(products)
			.where(gt(products.stockQuantity, 0));

		const categories = result
			.map(r => r.category)
			.filter((c): c is string => c !== null && c !== undefined && c.trim() !== "");

		return res.status(200).json({
			success: true,
			categories: ["All", ...categories],
		});
	} catch (error) {
		console.error("Get Categories Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
