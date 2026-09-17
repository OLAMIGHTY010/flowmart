import { Request, Response } from "express";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { eq } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const getCategories = async (req: Request, res: Response) => {
	try {
		const allCategories = await db.select().from(categories);
		return res.status(200).json({ success: true, categories: allCategories });
	} catch (error) {
		console.error("Get Categories Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
	try {
		if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
			return res.status(403).json({ success: false, message: "Unauthorized" });
		}
		
		const { name, slug, parentId, iconUrl } = req.body;
		if (!name || !slug) {
			return res.status(400).json({ success: false, message: "Name and slug are required" });
		}

		const [newCat] = await db.insert(categories).values({
			name,
			slug,
			parentId: parentId || null,
			iconUrl: iconUrl || null,
		}).returning();

		return res.status(201).json({ success: true, category: newCat });
	} catch (error) {
		console.error("Create Category Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
