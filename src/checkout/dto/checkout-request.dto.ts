import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutRequestDto {
  @ApiPropertyOptional({ example: 'uuid-address' })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ example: 'mock', enum: ['mock', 'cod'] })
  @IsString()
  @IsIn(['mock', 'cod'])
  paymentMethod!: string;

  @ApiProperty({ example: 'idemp-001' })
  @IsString()
  idempotencyKey!: string;
}
