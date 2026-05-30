import { ApiProperty } from '@nestjs/swagger';

class CheckoutItemDto {
  @ApiProperty({ example: 'uuid' })
  variantId!: string;

  @ApiProperty({ example: 'AUR-WL-001-N' })
  sku!: string;

  @ApiProperty({ example: 2 })
  qty!: number;

  @ApiProperty({ example: 79.99 })
  unitPrice!: number;

  @ApiProperty({ example: 159.98 })
  totalPrice!: number;
}

export class CheckoutResponseDto {
  @ApiProperty({ example: 'uuid-order' })
  orderId!: string;

  @ApiProperty({ example: 'stock_reserved' })
  status!: string;

  @ApiProperty({ example: 159.98 })
  total!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ type: [CheckoutItemDto] })
  items!: CheckoutItemDto[];

  @ApiProperty({ example: 'uuid-payment' })
  paymentId!: string;

  @ApiProperty({ example: 'mock' })
  paymentProvider!: string;

  @ApiProperty({ example: 'pending' })
  paymentStatus!: string;
}
