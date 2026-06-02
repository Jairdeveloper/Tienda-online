export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  listPrice?: number;
  attributes: Record<string, string>;
  barcode?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  attributes?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  categories: string[];
  variants: ProductVariant[];
  minPrice: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  qty: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}

export interface InventoryInfo {
  variantId: string;
  available: number;
  quantity: number;
  reserved: number;
  safetyStock: number;
}
