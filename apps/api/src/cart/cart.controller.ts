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
import { Public } from '../auth/decorators/public.decorator';
import { CartService } from './cart.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('cart')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ description: 'Active cart with items' })
  async getCart(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.getActiveCart(user.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Item added to cart' })
  async addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Cart item updated' })
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.cartService.updateItem(user.id, itemId, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Item removed from cart' })
  async removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Cart cleared' })
  async clearCart(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.clearCart(user.id);
  }

  @Public()
  @Get('status')
  @ApiOkResponse({ description: 'Cart module health check' })
  status(): { module: string; status: string } {
    return { module: 'cart', status: 'ok' };
  }
}
