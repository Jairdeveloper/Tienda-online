import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import type { Prisma } from '@prisma/client';
import { OrderStatus, TERMINAL_STATUSES, CANCELLABLE_STATUSES } from './enum/order-status.enum';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly inventoryService: InventoryService,
  ) {}

  async findUserOrders(userId: string, query: OrderListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) where.status = query.status;

    const orderBy: any = {};
    orderBy[query.sort ?? 'createdAt'] = query.order ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((o: any) => OrderResponseDto.from(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        payments: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return OrderResponseDto.from(order);
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (TERMINAL_STATUSES.includes(order.status as OrderStatus)) {
      throw new BadRequestException('Cannot cancel order in terminal status');
    }

    if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      for (const item of order.items) {
        await this.inventoryService.releaseStock(item.variantId, item.qty, tx as any);
      }

      await tx.auditLog.create({
        data: {
          tableName: 'orders',
          recordId: orderId,
          action: 'cancel',
          userId,
          diff: { reason, previousStatus: order.status, newStatus: OrderStatus.CANCELLED },
        },
      });
    });

    return this.findOrderById(userId, orderId);
  }

  async findOrderStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, total: true, currency: true, userId: true, createdAt: true },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      status: order.status,
      total: typeof order.total === 'number' ? order.total : order.total?.toNumber(),
      currency: order.currency,
      createdAt: order.createdAt?.toISOString(),
    };
  }
}
