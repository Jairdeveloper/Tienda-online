import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus } from '../orders/enum/order-status.enum';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

  async checkout(userId: string, dto: CheckoutRequestDto): Promise<CheckoutResponseDto> {
    const idempotencyKey = `checkout:${userId}:${dto.idempotencyKey}`;

    const existing = await this.redis.get(idempotencyKey);
    if (existing) {
      const orderId = existing;
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { variant: true } }, payments: true },
      });
      if (order) {
        throw new ConflictException({
          message: 'Idempotency key already used',
          orderId: order.id,
          status: order.status,
        });
      }
    }

    const cart = await this.cartService.getActiveCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const variantIds = cart.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { inventory: true },
    });

    const variantMap = new Map(variants.map((v: any) => [v.id, v]));

    const stockErrors: Array<{ variantId: string; sku: string; available: number; requested: number }> = [];
    for (const item of cart.items) {
      const variant: any = variantMap.get(item.variantId);
      if (!variant || !variant.inventory) {
        stockErrors.push({ variantId: item.variantId, sku: item.sku, available: 0, requested: item.quantity });
        continue;
      }
      const available = variant.inventory.quantity - variant.inventory.reserved;
      if (available < item.quantity) {
        stockErrors.push({
          variantId: item.variantId,
          sku: item.sku,
          available: Math.max(0, available),
          requested: item.quantity,
        });
      }
    }

    if (stockErrors.length > 0) {
      throw new ConflictException({
        message: 'Insufficient stock for some items',
        items: stockErrors,
      });
    }

    let addressSnapshot: Record<string, unknown> | null = null;
    if (dto.addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: dto.addressId },
      });
      if (!address || address.userId !== userId) {
        throw new ForbiddenException('Address not found or does not belong to user');
      }
      addressSnapshot = {
        id: address.id,
        label: address.label,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        phone: address.phone,
      };
    }

    const result: any = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const itemsData = cart.items.map((item) => {
        const variant: any = variantMap.get(item.variantId);
        const unitPrice = typeof variant.price === 'number'
          ? variant.price
          : variant.price.toNumber();
        return {
          variantId: item.variantId,
          qty: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        };
      });

      const total = itemsData.reduce((sum, i) => sum + i.totalPrice, 0);

      const order = await tx.order.create({
        data: {
          userId,
          externalId: dto.idempotencyKey,
          status: OrderStatus.CREATED,
          total,
          currency: 'USD',
          shippingAddress: addressSnapshot as any,
          items: {
            create: itemsData.map((i) => ({
              variantId: i.variantId,
              qty: i.qty,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of (order as any).items) {
        const reserved = await this.inventoryService.reserveStock(item.variantId, item.qty, tx as any);
        if (!reserved) {
          throw new Error(`STOCK_FAILED:${item.variantId}`);
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.STOCK_RESERVED },
      });

      return order;
    });

    await this.redis.set(idempotencyKey, result.id, 86400);

    const cartResult = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
    });
    if (cartResult) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cartResult.id } });
      await this.prisma.cart.update({
        where: { id: cartResult.id },
        data: { status: 'completed' },
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: result.id,
        provider: dto.paymentMethod,
        status: 'pending',
        amount: result.total,
        currency: 'USD',
        rawResponse: { provider: dto.paymentMethod, createdAt: new Date().toISOString() },
      },
    });

    const responseItems = result.items.map((item: any) => {
      const variant: any = variantMap.get(item.variantId);
      return {
        variantId: item.variantId,
        sku: variant.sku ?? '',
        qty: item.qty,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : item.unitPrice.toNumber(),
        totalPrice: typeof item.totalPrice === 'number' ? item.totalPrice : item.totalPrice.toNumber(),
      };
    });

    return {
      orderId: result.id,
      status: OrderStatus.STOCK_RESERVED,
      total: typeof result.total === 'number' ? result.total : result.total.toNumber(),
      currency: result.currency,
      items: responseItems,
      paymentId: payment.id,
      paymentProvider: dto.paymentMethod,
      paymentStatus: 'pending',
    };
  }
}
