import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CatalogService } from './catalog.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { VariantResponseDto } from './dto/variant-response.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('categories')
  @ApiOkResponse({ type: [CategoryResponseDto] })
  async findCategories(): Promise<CategoryResponseDto[]> {
    return this.catalogService.findCategories();
  }

  @Public()
  @Get('products')
  @ApiOkResponse({ type: PaginatedResponseDto<ProductResponseDto> })
  async findProducts(
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.catalogService.findProducts(query);
  }

  @Public()
  @Get('products/:id')
  @ApiOkResponse({ type: ProductResponseDto })
  async findProductById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.catalogService.findProductById(id);
  }

  @Public()
  @Get('products/:id/variants')
  @ApiOkResponse({ type: [VariantResponseDto] })
  async findProductVariants(
    @Param('id') id: string,
  ): Promise<VariantResponseDto[]> {
    return this.catalogService.findProductVariants(id);
  }

  @Public()
  @Get('inventory/:variantId')
  @ApiOkResponse({ description: 'Inventory availability' })
  async findVariantInventory(
    @Param('variantId') variantId: string,
  ): Promise<{ variantId: string; available: number; quantity: number; reserved: number; safetyStock: number }> {
    return this.catalogService.findVariantInventory(variantId);
  }

  @Public()
  @Get('status')
  @ApiOkResponse({ description: 'Catalog module health check' })
  status(): { module: string; status: string } {
    return { module: 'catalog', status: 'ok' };
  }
}
