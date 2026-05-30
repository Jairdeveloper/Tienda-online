import { ApiProperty } from '@nestjs/swagger';

export class VariantResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AUR-WL-001-N' })
  sku!: string;

  @ApiProperty({ example: 79.99 })
  price!: number;

  @ApiProperty({ example: 99.99, required: false })
  listPrice?: number | null;

  @ApiProperty({ example: { color: 'Negro' }, required: false })
  attributes?: Record<string, unknown>;

  @ApiProperty({ example: '123456789012', required: false })
  barcode?: string | null;

  static from(entity: { id: string; sku: string; price: { toNumber?: () => number } | number; listPrice?: { toNumber?: () => number } | number | null; attributes?: unknown; barcode?: string | null }): VariantResponseDto {
    const dto = new VariantResponseDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.price = typeof entity.price === 'number' ? entity.price : (entity.price as any).toNumber();
    dto.listPrice = entity.listPrice ? (typeof entity.listPrice === 'number' ? entity.listPrice : (entity.listPrice as any).toNumber()) : null;
    dto.attributes = entity.attributes as Record<string, unknown> | undefined;
    dto.barcode = entity.barcode ?? null;
    return dto;
  }
}
