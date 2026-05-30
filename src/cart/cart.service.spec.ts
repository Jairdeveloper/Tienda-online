import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockService } from '../redis/redis-lock.service';

describe('CartService', () => {
  let service: CartService;

  const mockPrisma = {
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
  };

  const mockRedisLock = {
    acquire: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisLockService, useValue: mockRedisLock },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  describe('getActiveCart', () => {
    it('should return existing active cart', async () => {
      const cart = {
        id: 'cart-1',
        status: 'active',
        items: [],
      };
      mockPrisma.cart.findFirst.mockResolvedValue(cart);
      mockPrisma.cart.create.mockResolvedValue(null);

      const result = await service.getActiveCart('user-1');

      expect(result.id).toBe('cart-1');
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create cart if none exists', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue({
        id: 'cart-new',
        status: 'active',
        items: [],
      });

      const result = await service.getActiveCart('user-1');

      expect(result.id).toBe('cart-new');
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', status: 'active' },
        include: { items: { include: { variant: { include: { product: true } } } } },
      });
    });
  });

  describe('addItem', () => {
    const dto = { variantId: 'variant-1', quantity: 2 };

    beforeEach(() => {
      mockRedisLock.acquire.mockResolvedValue(true);
      mockRedisLock.release.mockResolvedValue(true);
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        sku: 'VAR-1',
        price: 100,
        product: { name: 'Product 1' },
        inventory: { quantity: 50, reserved: 10 },
      });
    });

    it('should add item to cart', async () => {
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce({ id: 'cart-1', status: 'active' })
        .mockResolvedValueOnce({ id: 'cart-1', status: 'active', items: [] });
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({ id: 'item-new' });

      const result = await service.addItem('user-1', dto);

      expect(result).toBeDefined();
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'cart-1', variantId: 'variant-1', quantity: 2, priceSnapshot: 100 },
      });
    });

    it('should increment quantity if item already in cart', async () => {
      mockPrisma.cart.findFirst
        .mockResolvedValueOnce({ id: 'cart-1', status: 'active' })
        .mockResolvedValueOnce({ id: 'cart-1', status: 'active', items: [] });
      mockPrisma.cartItem.findFirst.mockResolvedValue({ id: 'existing-item', quantity: 1 });

      await service.addItem('user-1', dto);

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'existing-item' },
        data: { quantity: 3 },
      });
    });

    it('should throw BadRequestException when stock insufficient', async () => {
      const dtoBig = { variantId: 'variant-1', quantity: 999 };
      mockPrisma.cart.findFirst.mockResolvedValue({ id: 'cart-1', status: 'active' });

      await expect(service.addItem('user-1', dtoBig)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.addItem('user-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    const dto = { quantity: 3 };

    it('should update item quantity', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
        variant: { inventory: { quantity: 50, reserved: 5 } },
      });
      mockPrisma.cart.findFirst.mockResolvedValue({ id: 'cart-1', status: 'active', items: [] });

      const result = await service.updateItem('user-1', 'item-1', dto);

      expect(result).toBeDefined();
      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 3 },
      });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.updateItem('user-1', 'nonexistent', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item belongs to different user', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'other-user' },
        variant: { inventory: null },
      });

      await expect(service.updateItem('user-1', 'item-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock insufficient', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
        variant: { inventory: { quantity: 5, reserved: 5 } },
      });

      await expect(service.updateItem('user-1', 'item-1', { quantity: 10 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
      });
      mockPrisma.cart.findFirst.mockResolvedValue({ id: 'cart-1', status: 'active', items: [] });

      const result = await service.removeItem('user-1', 'item-1');

      expect(result).toBeDefined();
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(service.removeItem('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear cart items', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue({ id: 'cart-1' });

      const result = await service.clearCart('user-1');

      expect(result.message).toBe('Cart cleared successfully');
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    });

    it('should not fail when no cart exists', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null);

      const result = await service.clearCart('user-1');

      expect(result.message).toBe('Cart cleared successfully');
      expect(mockPrisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });
  });
});
