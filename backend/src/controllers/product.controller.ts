import { Request, Response } from 'express';
import { db } from '../../db';
import { products } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 1. Create a Product (Vendors Only)
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, stockQuantity, imageUrl } = req.body;
    const vendorId = req.user?.id;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const [newProduct] = await db.insert(products).values({
      vendorId: vendorId!,
      name,
      description,
      price,
      stockQuantity: stockQuantity || 0,
      imageUrl,
    }).returning();

    return res.status(201).json({ success: true, message: 'Product created', product: newProduct });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 2. Get All Available Products (For Attendees)
export const getProducts = async (req: Request, res: Response) => {
  try {
    // Only fetch products where stockQuantity is greater than 0 to hide out-of-stock items
    const availableProducts = await db.select().from(products).where(gt(products.stockQuantity, 0));
    
    return res.status(200).json({ success: true, products: availableProducts });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 3. Update Product & Inventory (Vendors Only)
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const vendorId = req.user?.id;
    const { name, description, price, stockQuantity, imageUrl } = req.body;

    // Verify the product belongs to the vendor requesting the update
    const [existingProduct] = await db.select().from(products)
      .where(and(eq(products.id, productId), eq(products.vendorId, vendorId!)))
      .limit(1);

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }

    const [updatedProduct] = await db.update(products)
      .set({
        name: name || existingProduct.name,
        description: description !== undefined ? description : existingProduct.description,
        price: price || existingProduct.price,
        stockQuantity: stockQuantity !== undefined ? stockQuantity : existingProduct.stockQuantity,
        imageUrl: imageUrl || existingProduct.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return res.status(200).json({ success: true, message: 'Product updated', product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 4. Delete a Product (Vendors Only)
export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const vendorId = req.user?.id;

    const [deletedProduct] = await db.delete(products)
      .where(and(eq(products.id, productId), eq(products.vendorId, vendorId!)))
      .returning();

    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
