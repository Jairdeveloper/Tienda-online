import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma: any = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productCategory: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    inventory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: any) => any) => cb(mockPrisma)),
    $queryRaw: jest.fn(),
  };

  const mockInventoryService = {
    confirmDeduction: jest.fn(),
    releaseStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  describe('listProducts', () => {
    it('should return paginated products', async () => {
      const products = [{ id: '1', name: 'Test Product' }];
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.listProducts({ page: 1, limit: 20 });

      expect(result.items).toEqual(products);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by isActive', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.listProducts({ isActive: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by name or sku', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.listProducts({ q: 'test' });

      const callArgs = mockPrisma.product.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(2);
    });
  });

  describe('getProduct', () => {
    it('should return product when found', async () => {
      const product = { id: '1', name: 'Test' };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      const result = await service.getProduct('1');
      expect(result).toEqual(product);
    });

    it('should throw when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getProduct('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProduct', () => {
    it('should create product without categories', async () => {
      const dto: CreateProductDto = {
        name: 'New Product',
        sku: 'NEW-001',
      };
      const created = { id: '1', ...dto };
      mockPrisma.product.create.mockResolvedValue(created);

      const result = await service.createProduct(dto);
      expect(result.id).toBe('1');
    });

    it('should create product with categories', async () => {
      const dto: CreateProductDto = {
        name: 'Categorized',
        sku: 'CAT-001',
        categoryIds: ['cat1'],
      };
      mockPrisma.product.create.mockResolvedValue({ id: '2', name: 'Categorized' });

      await service.createProduct(dto);

      expect(mockPrisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: expect.objectContaining({
              create: [{ categoryId: 'cat1' }],
            }),
          }),
        }),
      );
    });
  });

  describe('updateProduct', () => {
    it('should update existing product', async () => {
      const existing = { id: '1', name: 'Old', isActive: true };
      mockPrisma.product.findUnique.mockResolvedValue(existing);
      mockPrisma.productCategory.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.productCategory.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.product.update = jest.fn().mockResolvedValue({ id: '1', name: 'Updated' });

      const dto: UpdateProductDto = { name: 'Updated' };
      const result = await service.updateProduct('1', dto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });

    it('should throw when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProduct('missing', {} as any, 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1', isActive: true });
      mockPrisma.product.update = jest.fn().mockResolvedValue({ id: '1', deletedAt: new Date() });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.deleteProduct('1', 'admin-id');
      expect(result.deleted).toBe(true);
    });

    it('should throw when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct('missing', 'admin-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listInventory', () => {
    it('should return paginated inventory without low stock filter', async () => {
      const items = [{ id: 'inv1', variantId: 'v1', quantity: 10, reserved: 2 }];
      mockPrisma.inventory.findMany.mockResolvedValue(items);
      mockPrisma.inventory.count.mockResolvedValue(1);

      const result = await service.listInventory({ page: 1, limit: 20 });

      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
    });

    it('should filter low stock inventory using raw SQL', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ variant_id: 'v1' }]);
      mockPrisma.inventory.findMany.mockResolvedValue([]);
      mockPrisma.inventory.count.mockResolvedValue(0);

      await service.listInventory({ lowStock: true });

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { variantId: { in: ['v1'] } },
        }),
      );
    });
  });

  describe('updateInventory', () => {
    it('should update inventory and log audit', async () => {
      const existing = { variantId: 'v1', quantity: 5, reserved: 0, safetyStock: 2 };
      mockPrisma.inventory.findUnique.mockResolvedValue(existing);
      mockPrisma.inventory.update = jest.fn().mockResolvedValue({ ...existing, quantity: 10 });

      const dto: UpdateInventoryDto = { quantity: 10 };
      const result = await service.updateInventory('v1', dto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw when inventory not found', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.updateInventory('missing', {} as any, 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
