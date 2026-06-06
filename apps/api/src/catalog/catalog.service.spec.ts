import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../common/cache/cache.service';

describe('CatalogService', () => {
  let service: CatalogService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    inventory: {
      findUnique: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    jest.clearAllMocks();
  });

  describe('findCategories', () => {
    it('should return list of categories', async () => {
      const categories = [
        { id: '1', name: 'Electrónica', slug: 'electronica', metadata: null, createdAt: new Date() },
        { id: '2', name: 'Ropa', slug: 'ropa', metadata: null, createdAt: new Date() },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findCategories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Electrónica');
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    });

    it('should return empty array when no categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      const result = await service.findCategories();
      expect(result).toEqual([]);
    });
  });

  describe('findProducts', () => {
    const baseQuery = { page: 1, limit: 20, sort: 'createdAt', order: 'desc' as const };

    it('should return paginated products', async () => {
      const products = [
        {
          id: '1', sku: 'SKU-1', name: 'Product 1', description: 'Desc', attributes: null,
          isActive: true, createdAt: new Date(),
          categories: [{ category: { name: 'Electrónica' } }],
          variants: [{ id: 'v1', sku: 'VAR-1', price: 100, listPrice: 120, attributes: null, barcode: null, inventory: { quantity: 10, reserved: 0 } }],
        },
      ];
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findProducts(baseQuery as any);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply category filter', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findProducts({ ...baseQuery, categoryId: 'cat-1' } as any);

      const where = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(where.categories.some.categoryId).toBe('cat-1');
    });

    it('should apply text search filter', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findProducts({ ...baseQuery, q: 'auricular' } as any);

      const where = mockPrisma.product.findMany.mock.calls[0][0].where;
      expect(where.OR[0].name.contains).toBe('auricular');
    });
  });

  describe('findProductById', () => {
    it('should return product when found', async () => {
      const product = {
        id: '1', sku: 'SKU-1', name: 'Product 1', description: 'Desc', attributes: null,
        isActive: true, createdAt: new Date(),
        categories: [{ category: { name: 'Electrónica' } }],
        variants: [],
      };
      mockPrisma.product.findFirst.mockResolvedValue(product);

      const result = await service.findProductById('1');

      expect(result.id).toBe('1');
      expect(result.name).toBe('Product 1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findProductById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findProductVariants', () => {
    it('should return variants for existing product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.productVariant.findMany.mockResolvedValue([
        { id: 'v1', sku: 'VAR-1', price: 100, listPrice: 120, attributes: null, barcode: null },
      ]);

      const result = await service.findProductVariants('1');

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('VAR-1');
    });

    it('should throw NotFoundException for non-existent product', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findProductVariants('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findVariantInventory', () => {
    it('should return availability', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue({
        variantId: 'v1', quantity: 100, reserved: 10, safetyStock: 10,
      });

      const result = await service.findVariantInventory('v1');

      expect(result.available).toBe(90);
      expect(result.quantity).toBe(100);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await expect(service.findVariantInventory('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
