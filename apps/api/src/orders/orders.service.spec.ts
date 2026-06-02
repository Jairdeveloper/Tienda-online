import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockInventoryService = {
    releaseStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('findUserOrders', () => {
    it('should return paginated orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      const result = await service.findUserOrders('user-1', { page: 1, limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });
  });

  describe('findOrderById', () => {
    it('should return order when found and owned by user', async () => {
      const orderData = {
        id: 'order-1', userId: 'user-1', status: 'paid', total: 100, currency: 'USD',
        items: [], payments: [],
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockPrisma.order.findUnique.mockResolvedValue(orderData);

      const result = await service.findOrderById('user-1', 'order-1');
      expect(result.id).toBe('order-1');
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOrderById('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when order belongs to different user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'other-user',
      });

      await expect(service.findOrderById('user-1', 'order-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and release stock', async () => {
      mockPrisma.order.findUnique
        .mockResolvedValueOnce({
          id: 'order-1', userId: 'user-1', status: 'stock_reserved',
          items: [{ variantId: 'var-1', qty: 2 }],
        })
        .mockResolvedValueOnce({
          id: 'order-1', userId: 'user-1', status: 'cancelled', total: 100, currency: 'USD',
          items: [], payments: [],
          createdAt: new Date(), updatedAt: new Date(),
        });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: { update: jest.fn() },
          auditLog: { create: jest.fn() },
        };
        return cb(tx);
      });
      mockInventoryService.releaseStock.mockResolvedValue(undefined);

      const result = await service.cancelOrder('user-1', 'order-1', 'changed mind');
      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException for terminal status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'fulfilled',
        items: [],
      });

      await expect(service.cancelOrder('user-1', 'order-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOrderStatus', () => {
    it('should return status summary', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'paid', total: 100, currency: 'USD',
        createdAt: new Date(),
      });

      const result = await service.findOrderStatus('order-1', 'user-1');
      expect(result.status).toBe('paid');
    });
  });
});
