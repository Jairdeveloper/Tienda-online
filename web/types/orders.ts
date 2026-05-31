export interface OrderItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentInfo {
  id: string;
  provider: string;
  status: string;
  amount: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  currency: string;
  items: OrderItem[];
  payments?: PaymentInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckoutRequest {
  addressId?: string;
  paymentMethod: "mock" | "cod";
  idempotencyKey: string;
}

export interface CheckoutItem {
  variantId: string;
  sku: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CheckoutResponse {
  orderId: string;
  status: string;
  total: number;
  currency: string;
  items: CheckoutItem[];
  paymentId: string;
  paymentProvider: string;
  paymentStatus: string;
}
