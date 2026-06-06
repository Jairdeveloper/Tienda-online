import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import { PrismaClient } from '@prisma/client';
import { CategoryResponseDto } from './dto/category-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { VariantResponseDto } from './dto/variant-response.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';

const CACHE_PREFIX = 'catalog:';

function queryCacheKey(base: string, params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return `${base}:${parts.join('&')}`;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService,
  ) {}

  async findCategories(): Promise<CategoryResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}categories`;
    const cached = await this.cache.get<CategoryResponseDto[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    const dtos = categories.map(CategoryResponseDto.from);
    await this.cache.set(cacheKey, dtos, 600);
    return dtos;
  }

  async findProducts(query: ProductQueryDto): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const cacheKey = queryCacheKey(`${CACHE_PREFIX}products`, query as unknown as Record<string, unknown>);
    const cached = await this.cache.get<PaginatedResponseDto<ProductResponseDto>>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
    };

    if (query.categoryId) {
      where.categories = { some: { categoryId: query.categoryId } };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        },
      };
    }

    const orderBy: Record<string, unknown> = {};
    if (query.sort === 'name') orderBy.name = query.order;
    else if (query.sort === 'createdAt') orderBy.createdAt = query.order;

    const skip = (query.page! - 1) * query.limit!;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          variants: { include: { inventory: true } },
        },
        orderBy,
        skip,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const items = products.map(ProductResponseDto.from);
    const result = PaginatedResponseDto.from(items, total, query.page!, query.limit!);
    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  async findProductById(id: string): Promise<ProductResponseDto> {
    const cacheKey = `${CACHE_PREFIX}product:${id}`;
    const cached = await this.cache.get<ProductResponseDto>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: {
        categories: { include: { category: true } },
        variants: { include: { inventory: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const dto = ProductResponseDto.from(product);
    await this.cache.set(cacheKey, dto, 300);
    return dto;
  }

  async findProductVariants(productId: string): Promise<VariantResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}product:${productId}:variants`;
    const cached = await this.cache.get<VariantResponseDto[]>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });

    if (!product) throw new NotFoundException('Product not found');

    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sku: 'asc' },
    });

    const dtos = variants.map(VariantResponseDto.from);
    await this.cache.set(cacheKey, dtos, 300);
    return dtos;
  }

  async findVariantInventory(variantId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
    });

    if (!inventory) throw new NotFoundException('Inventory not found for variant');

    return {
      variantId: inventory.variantId,
      available: inventory.quantity - inventory.reserved,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      safetyStock: inventory.safetyStock,
    };
  }
}
