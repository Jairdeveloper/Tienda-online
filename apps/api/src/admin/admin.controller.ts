import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@ApiTags('admin')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  @ApiOkResponse({ description: 'List all orders (admin)' })
  async listOrders(
    @Query() query: AdminOrderQueryDto,
  ) {
    return this.adminService.listOrders(query);
  }

  @Get('orders/:id')
  @ApiOkResponse({ description: 'Order detail (admin)' })
  async getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @ApiOkResponse({ description: 'Order status updated' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.updateOrderStatus(id, dto, user.id);
  }

  @Get('products')
  @ApiOkResponse({ description: 'List all products (admin)' })
  async listProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      q,
    });
  }

  @Get('products/:id')
  @ApiOkResponse({ description: 'Product detail (admin)' })
  async getProduct(@Param('id') id: string) {
    return this.adminService.getProduct(id);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Product created' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOkResponse({ description: 'Product updated' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.updateProduct(id, dto, user.id);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Product deleted (soft)' })
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.deleteProduct(id, user.id);
  }

  @Post('products/:id/variants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Variant created' })
  async createVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.createVariant(id, dto, user.id);
  }

  @Patch('variants/:id')
  @ApiOkResponse({ description: 'Variant updated' })
  async updateVariant(
    @Param('id') id: string,
    @Body() dto: UpdateVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.updateVariant(id, dto, user.id);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Variant deleted' })
  async deleteVariant(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.deleteVariant(id, user.id);
  }

  @Get('inventory')
  @ApiOkResponse({ description: 'List inventory (admin)' })
  async listInventory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.adminService.listInventory({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      lowStock: lowStock === 'true',
    });
  }

  @Patch('inventory/:variantId')
  @ApiOkResponse({ description: 'Inventory updated' })
  async updateInventory(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.updateInventory(variantId, dto, user.id);
  }
}
