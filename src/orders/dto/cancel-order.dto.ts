import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Ya no lo necesito' })
  @IsOptional()
  @IsString()
  reason?: string;
}
