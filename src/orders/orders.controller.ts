import {
  Controller, Get, Param, Post, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOkResponse({ description: 'List user orders' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OrderListQueryDto,
  ) {
    return this.ordersService.findUserOrders(user.id, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: OrderResponseDto })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOrderById(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: OrderResponseDto })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(user.id, id, dto.reason);
  }

  @Get(':id/status')
  @ApiOkResponse({ description: 'Order status summary' })
  async status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOrderStatus(id, user.id);
  }
}
