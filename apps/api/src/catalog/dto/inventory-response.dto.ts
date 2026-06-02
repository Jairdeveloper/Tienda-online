import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({ example: 'uuid' })
  variantId!: string;

  @ApiProperty({ example: 90 })
  available!: number;

  @ApiProperty({ example: 100 })
  quantity!: number;

  @ApiProperty({ example: 10 })
  reserved!: number;

  @ApiProperty({ example: 10 })
  safetyStock!: number;

  static from(entity: { variantId: string; quantity: number; reserved: number; safetyStock: number }): InventoryResponseDto {
    const dto = new InventoryResponseDto();
    dto.variantId = entity.variantId;
    dto.available = entity.quantity - entity.reserved;
    dto.quantity = entity.quantity;
    dto.reserved = entity.reserved;
    dto.safetyStock = entity.safetyStock;
    return dto;
  }
}
