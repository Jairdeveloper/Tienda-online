import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'paid', enum: ['paid', 'fulfilled', 'cancelled', 'payment_failed'] })
  @IsString()
  @IsIn(['paid', 'fulfilled', 'cancelled', 'payment_failed'])
  status!: string;

  @ApiPropertyOptional({ example: 'Pago confirmado contra entrega' })
  @IsOptional()
  @IsString()
  reason?: string;
}
