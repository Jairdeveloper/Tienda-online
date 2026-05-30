import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+525551234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
