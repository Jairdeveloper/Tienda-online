import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  variantId!: string;

  @ApiProperty({ example: 'AUR-WL-001-N' })
  sku!: string;

  @ApiProperty({ example: 'Auriculares Inalámbricos Pro' })
  productName!: string;

  @ApiProperty({ example: 2 })
  qty!: number;

  @ApiProperty({ example: 79.99 })
  unitPrice!: number;

  @ApiProperty({ example: 159.98 })
  totalPrice!: number;
}

class PaymentDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'mock' })
  provider!: string;

  @ApiProperty({ example: 'paid' })
  status!: string;

  @ApiProperty({ example: 100.00 })
  amount!: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  userId!: string;

  @ApiProperty({ example: 'stock_reserved' })
  status!: string;

  @ApiProperty({ example: 159.98 })
  total!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ type: [OrderItemDto] })
  items!: OrderItemDto[];

  @ApiProperty({ type: [PaymentDto], required: false })
  payments?: PaymentDto[];

  @ApiProperty({ example: '2026-05-27T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-27T00:00:00.000Z' })
  updatedAt!: string;

  static from(order: any): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.userId = order.userId;
    dto.status = order.status;
    dto.total = typeof order.total === 'number' ? order.total : order.total?.toNumber();
    dto.currency = order.currency;
    dto.createdAt = order.createdAt?.toISOString();
    dto.updatedAt = order.updatedAt?.toISOString();

    if (order.items) {
      dto.items = order.items.map((item: any) => ({
        id: item.id,
        variantId: item.variantId,
        sku: item.variant?.sku ?? '',
        productName: item.variant?.product?.name ?? '',
        qty: item.qty,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : item.unitPrice?.toNumber(),
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : item.totalPrice?.toNumber(),
      }));
    }

    if (order.payments) {
      dto.payments = order.payments.map((p: any) => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        amount: p.amount ? (typeof p.amount === 'number' ? p.amount : p.amount?.toNumber()) : 0,
      }));
    }

    return dto;
  }
}
