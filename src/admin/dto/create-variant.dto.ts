import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'WH-001-BLK' })
  @IsString()
  sku!: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 129.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  listPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '8801234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number;
}
