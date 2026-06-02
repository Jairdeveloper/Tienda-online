export enum OrderStatus {
  CREATED = 'created',
  STOCK_RESERVED = 'stock_reserved',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  COD_PENDING = 'cod_pending',
  PAYMENT_FAILED = 'payment_failed',
  CANCELLED = 'cancelled',
  FULFILLED = 'fulfilled',
}

export const TERMINAL_STATUSES: OrderStatus[] = [
  OrderStatus.CANCELLED,
  OrderStatus.FULFILLED,
];

export const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.STOCK_RESERVED,
  OrderStatus.PAYMENT_PENDING,
  OrderStatus.COD_PENDING,
  OrderStatus.PAYMENT_FAILED,
];
