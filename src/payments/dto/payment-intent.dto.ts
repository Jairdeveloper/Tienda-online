import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentIntentDto {
  @ApiProperty({ example: 'mock', enum: ['mock', 'cod'] })
  @IsString()
  @IsIn(['mock', 'cod'])
  provider!: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
