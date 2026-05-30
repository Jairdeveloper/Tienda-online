import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Current user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/addresses')
  @ApiOkResponse({ description: 'List of user addresses' })
  async listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listAddresses(user.id);
  }

  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Address created' })
  async createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Address updated' })
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Address deleted' })
  async deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') addressId: string,
  ): Promise<void> {
    return this.usersService.deleteAddress(user.id, addressId);
  }

  @Get('status')
  @ApiOkResponse({ description: 'Users module health check' })
  status(): { module: string; status: string } {
    return { module: 'users', status: 'ok' };
  }
}
