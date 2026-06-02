import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken!: string;

  @ApiProperty({ example: 'uuid-refresh-token' })
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;
}

export class AuthUserDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Juan Pérez', required: false })
  name?: string;

  @ApiProperty({ example: ['customer'] })
  roles!: string[];

  @ApiProperty({ example: ['products:read'] })
  permissions!: string[];
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}
