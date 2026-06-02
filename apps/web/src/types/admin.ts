export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  categoryIds?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface CreateVariantInput {
  sku: string;
  price: number;
  listPrice?: number;
  attributes?: Record<string, unknown>;
  barcode?: string;
  initialStock?: number;
}

export interface UpdateVariantInput extends Partial<CreateVariantInput> {}

export interface UpdateOrderStatusInput {
  status: "paid" | "fulfilled" | "cancelled" | "payment_failed";
  reason?: string;
}

export interface InventoryItem {
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  safetyStock: number;
  variant: { sku: string; product: { id: string; name: string } };
}

export interface UpdateInventoryInput {
  quantity?: number;
  safetyStock?: number;
}
