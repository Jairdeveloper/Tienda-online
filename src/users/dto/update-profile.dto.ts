import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+525551234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

}
