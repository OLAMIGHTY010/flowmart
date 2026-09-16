export interface Vendor {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  rating: number;
  totalProducts: number;
}

export interface Product {
  id: string;
  vendorId: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stockQuantity: number;
  imageUrl: string;
  images?: string[];
  category?: string;
  brand?: string;
  weight?: number;
  vendor?: Vendor;
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
  categoryId?: string;
  condition?: 'new' | 'used_like_new' | 'used_good' | 'used_fair';
  isNegotiable?: boolean;
  isSponsored?: boolean;
  rating?: number;
}