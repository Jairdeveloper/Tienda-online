import { ApiProperty } from '@nestjs/swagger';

class CartItemDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'uuid' })
  variantId!: string;

  @ApiProperty({ example: 'AUR-WL-001-N' })
  sku!: string;

  @ApiProperty({ example: 'Auriculares Inalámbricos Pro' })
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 79.99 })
  unitPrice!: number;

  @ApiProperty({ example: 159.98 })
  totalPrice!: number;

  @ApiProperty({ example: { color: 'Negro' }, required: false })
  attributes?: Record<string, unknown> | null;
}

export class CartResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ type: [CartItemDto] })
  items!: CartItemDto[];

  @ApiProperty({ example: 159.98 })
  total!: number;

  @ApiProperty({ example: 2 })
  itemCount!: number;

  @ApiProperty({ example: 'active' })
  status!: string;

  static from(cart: {
    id: string; status: string;
    items: Array<{
      id: string; variantId: string; quantity: number;
      priceSnapshot?: { toNumber?: () => number } | number | null;
      variant: {
        sku: string; price: { toNumber?: () => number } | number;
        attributes?: unknown;
        product: { name: string };
      };
    }>;
  }): CartResponseDto {
    const items = cart.items.map((item) => {
      const rawPrice = item.priceSnapshot ?? item.variant.price;
      const unitPrice = typeof rawPrice === 'number' ? rawPrice : (rawPrice as any).toNumber();
      return {
        id: item.id,
        variantId: item.variantId,
        sku: item.variant.sku,
        productName: item.variant.product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        attributes: item.variant.attributes as Record<string, unknown> | null,
      };
    });
    const dto = new CartResponseDto();
    dto.id = cart.id;
    dto.items = items;
    dto.total = items.reduce((sum, i) => sum + i.totalPrice, 0);
    dto.itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    dto.status = cart.status;
    return dto;
  }
}
