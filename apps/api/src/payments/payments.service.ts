import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { OrderStatus } from '../orders/enum/order-status.enum';
import { PaymentIntentDto } from './dto/payment-intent.dto';
import { PaymentConfirmDto } from './dto/payment-confirm.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly inventoryService: InventoryService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  async createIntent(userId: string, orderId: string, dto: PaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.STOCK_RESERVED) {
      throw new BadRequestException(
        `Invalid order status for payment: ${order.status}. Expected: stock_reserved`,
      );
    }

    const provider = this.providerFactory.getProviderByString(dto.provider);

    const intentResult = await provider.createIntent({
      id: order.id,
      total: typeof order.total === 'number' ? order.total : order.total.toNumber(),
      currency: order.currency,
    });

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.create({
        data: {
          orderId,
          provider: dto.provider,
          providerPaymentId: intentResult.providerPaymentId,
          amount: intentResult.amount,
          currency: intentResult.currency,
          status: 'pending',
          rawResponse: intentResult.rawResponse as any,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAYMENT_PENDING, paymentSnapshot: { provider: dto.provider } as any },
      });
    });

    return {
      paymentId: null,
      provider: dto.provider,
      status: 'pending',
      amount: intentResult.amount,
      currency: intentResult.currency,
    };
  }

  async confirmPayment(userId: string, orderId: string, dto: PaymentConfirmDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException(
        `Invalid order status for confirmation: ${order.status}. Expected: payment_pending`,
      );
    }

    const payment = order.payments[0];
    if (!payment) {
      throw new NotFoundException('No payment found for this order');
    }

    const provider = this.providerFactory.getProviderByString(payment.provider ?? 'mock');

    const confirmResult = await provider.confirm(payment as any, {
      providerPaymentId: dto.providerPaymentId,
    });

    const newStatus = confirmResult.status === 'paid' ? OrderStatus.PAID : OrderStatus.COD_PENDING;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: confirmResult.status,
          providerPaymentId: dto.providerPaymentId ?? payment.providerPaymentId,
          rawResponse: confirmResult.rawResponse as any,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (newStatus === OrderStatus.PAID) {
        for (const item of order.items) {
          await this.inventoryService.confirmDeduction(item.variantId, item.qty, tx as any);
        }
      }

      await tx.auditLog.create({
        data: {
          tableName: 'payments',
          recordId: payment.id,
          action: 'confirm',
          userId,
          diff: { previousStatus: 'pending', newStatus: confirmResult.status, orderStatus: newStatus },
        },
      });
    });

    return {
      paymentId: payment.id,
      status: confirmResult.status,
      orderStatus: newStatus,
    };
  }

  async handleWebhook(dto: PaymentWebhookDto) {
    const idempotencyKey = `webhook:${dto.providerPaymentId}`;
    const exists = await this.redis.exists(idempotencyKey);
    if (exists) {
      return { message: 'Webhook already processed' };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: { include: { items: true } } },
    });

    if (!payment || payment.providerPaymentId !== dto.providerPaymentId) {
      throw new NotFoundException('Payment not found or providerPaymentId mismatch');
    }

    switch (dto.event) {
      case 'payment.completed': {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'paid', rawResponse: { webhook: dto } as any },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.PAID },
          });

          for (const item of payment.order.items) {
            await this.inventoryService.confirmDeduction(item.variantId, item.qty, tx as any);
          }
        });
        break;
      }
      case 'payment.failed': {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'failed', rawResponse: { webhook: dto } as any },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.PAYMENT_FAILED },
          });
        });
        break;
      }
      case 'payment.refunded': {
        await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'refunded', rawResponse: { webhook: dto } as any },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.CANCELLED },
          });

          for (const item of payment.order.items) {
            await this.inventoryService.releaseStock(item.variantId, item.qty, tx as any);
          }
        });
        break;
      }
    }

    await this.redis.set(idempotencyKey, 'processed', 86400);

    return { message: `Webhook processed: ${dto.event}` };
  }
}
