import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({ example: 'payment.completed' })
  @IsString()
  @IsIn(['payment.completed', 'payment.failed', 'payment.refunded'])
  event!: string;

  @ApiProperty({ example: 'uuid-payment' })
  @IsString()
  paymentId!: string;

  @ApiProperty({ example: 'ext_123' })
  @IsString()
  providerPaymentId!: string;

  @ApiProperty({ example: 'paid' })
  @IsString()
  status!: string;

  @ApiProperty({ example: 100.00 })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
