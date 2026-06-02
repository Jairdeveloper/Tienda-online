import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Casa', required: false })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: 'Av. Reforma 123' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ example: 'Ciudad de México' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'CDMX', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'México', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '06600', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: '+525551234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
