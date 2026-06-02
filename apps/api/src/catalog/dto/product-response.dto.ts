import { ApiProperty } from '@nestjs/swagger';
import { VariantResponseDto } from './variant-response.dto';

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AUR-WL-001', required: false })
  sku?: string | null;

  @ApiProperty({ example: 'Auriculares Inalámbricos Pro' })
  name!: string;

  @ApiProperty({ example: 'Auriculares Bluetooth con cancelación de ruido activa', required: false })
  description?: string | null;

  @ApiProperty({ required: false })
  attributes?: Record<string, unknown> | null;

  @ApiProperty({ type: [String], example: ['Electrónica'] })
  categories!: string[];

  @ApiProperty({ type: [VariantResponseDto], required: false })
  variants?: VariantResponseDto[];

  @ApiProperty({ example: 79.99, required: false })
  minPrice?: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  createdAt!: Date;

  static from(entity: {
    id: string; sku?: string | null; name: string; description?: string | null;
    attributes?: unknown; isActive: boolean; createdAt: Date;
    categories?: Array<{ category: { name: string } }>;
    variants?: Array<any>;
  }): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = entity.id;
    dto.sku = entity.sku ?? null;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.attributes = entity.attributes as Record<string, unknown> | null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.categories = (entity.categories ?? []).map((pc: any) => pc.category.name);
    if (entity.variants && entity.variants.length > 0) {
      dto.variants = entity.variants.map(VariantResponseDto.from);
      dto.minPrice = Math.min(...entity.variants.map((v: any) =>
        typeof v.price === 'number' ? v.price : v.price.toNumber()
      ));
    }
    return dto;
  }
}
