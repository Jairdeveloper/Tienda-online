import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  const mockPrisma = {
    productVariant: { findMany: jest.fn() },
    address: { findUnique: jest.fn() },
    $transaction: jest.fn(),
    order: { findUnique: jest.fn() },
    cart: { findFirst: jest.fn(), update: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    payment: { create: jest.fn() },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockCartService = {
    getActiveCart: jest.fn(),
  };

  const mockInventoryService = {
    reserveStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: CartService, useValue: mockCartService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    const dto = { addressId: 'addr-1', paymentMethod: 'mock', idempotencyKey: 'idem-1' };
    const mockCart = {
      id: 'cart-1',
      items: [
        { variantId: 'var-1', sku: 'SKU-1', quantity: 2 },
      ],
    };

    beforeEach(() => {
      mockRedis.get.mockResolvedValue(null);
      mockCartService.getActiveCart.mockResolvedValue(mockCart);
      mockPrisma.productVariant.findMany.mockResolvedValue([
        { id: 'var-1', sku: 'SKU-1', price: 100, inventory: { quantity: 50, reserved: 10 } },
      ]);
      mockPrisma.address.findUnique.mockResolvedValue({
        id: 'addr-1', userId: 'user-1', label: 'Home', street: '123 St', city: 'NY',
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'order-1', total: 200, currency: 'USD', status: 'stock_reserved',
              items: [{ id: 'oi-1', variantId: 'var-1', qty: 2, unitPrice: 100, totalPrice: 200 }],
            }),
            update: jest.fn(),
          },
        };
        return cb(tx);
      });
      mockInventoryService.reserveStock.mockResolvedValue(true);
      mockPrisma.cart.findFirst.mockResolvedValue({ id: 'cart-1' });
      mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' });
    });

    it('should complete checkout successfully', async () => {
      const result = await service.checkout('user-1', dto);

      expect(result.orderId).toBe('order-1');
      expect(result.status).toBe('stock_reserved');
      expect(result.total).toBe(200);
      expect(result.paymentProvider).toBe('mock');
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate idempotency key', async () => {
      mockRedis.get.mockResolvedValue('order-existing');
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-existing' });

      await expect(service.checkout('user-1', dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for empty cart', async () => {
      mockCartService.getActiveCart.mockResolvedValue({ id: 'cart-1', items: [] });

      await expect(service.checkout('user-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for address not belonging to user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        id: 'addr-1', userId: 'other-user',
      });

      await expect(service.checkout('user-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });
});
