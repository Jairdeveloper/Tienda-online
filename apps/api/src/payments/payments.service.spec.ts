import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { CodPaymentProvider } from './providers/cod-payment.provider';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrisma = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    payment: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockRedis = { exists: jest.fn(), set: jest.fn() };
  const mockInventoryService = {
    confirmDeduction: jest.fn(),
    releaseStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaClient, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: InventoryService, useValue: mockInventoryService },
        MockPaymentProvider,
        CodPaymentProvider,
        PaymentProviderFactory,
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should create payment intent for mock provider', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'stock_reserved', total: 100, currency: 'USD',
        items: [],
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = { payment: { create: jest.fn() }, order: { update: jest.fn() } };
        return cb(tx);
      });

      const result = await service.createIntent('user-1', 'order-1', { provider: 'mock' });
      expect(result.provider).toBe('mock');
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createIntent('user-1', 'order-x', { provider: 'mock' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for wrong order status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'paid', total: 100, currency: 'USD',
      });
      await expect(service.createIntent('user-1', 'order-1', { provider: 'mock' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm mock payment', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'payment_pending', total: 100, currency: 'USD',
        items: [{ variantId: 'var-1', qty: 2 }],
        payments: [{ id: 'pay-1', provider: 'mock', providerPaymentId: 'mp-1', amount: 100 }],
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          payment: { update: jest.fn() },
          order: { update: jest.fn() },
          auditLog: { create: jest.fn() },
        };
        return cb(tx);
      });
      mockInventoryService.confirmDeduction.mockResolvedValue(undefined);

      const result = await service.confirmPayment('user-1', 'order-1', { providerPaymentId: 'mp-1' });
      expect(result.status).toBe('paid');
      expect(result.orderStatus).toBe('paid');
    });
  });

  describe('handleWebhook', () => {
    it('should process payment.completed webhook', async () => {
      mockRedis.exists.mockResolvedValue(false);
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1', providerPaymentId: 'ext_123', provider: 'mock',
        order: { items: [{ variantId: 'var-1', qty: 2 }] },
      });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          payment: { update: jest.fn() },
          order: { update: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.handleWebhook({
        event: 'payment.completed', paymentId: 'pay-1', providerPaymentId: 'ext_123',
        status: 'paid', amount: 100,
      });
      expect(result.message).toContain('payment.completed');
    });

    it('should return early for duplicate webhook', async () => {
      mockRedis.exists.mockResolvedValue(true);

      const result = await service.handleWebhook({
        event: 'payment.completed', paymentId: 'pay-1', providerPaymentId: 'ext_123',
        status: 'paid', amount: 100,
      });
      expect(result.message).toBe('Webhook already processed');
    });
  });
});
