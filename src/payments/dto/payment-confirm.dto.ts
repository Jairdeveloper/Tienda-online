import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentConfirmDto {
  @ApiPropertyOptional({ example: 'mock_pay_123' })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;
}
