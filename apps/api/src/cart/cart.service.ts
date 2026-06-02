import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockService } from '../redis/redis-lock.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisLock: RedisLockService,
  ) {}

  async getActiveCart(userId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, status: 'active' },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
    }

    return CartResponseDto.from(cart as any);
  }

  async addItem(userId: string, dto: AddItemDto): Promise<CartResponseDto> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { inventory: true, product: true },
    });

    if (!variant) throw new NotFoundException('Variant not found');

    const available = variant.inventory
      ? variant.inventory.quantity - variant.inventory.reserved
      : 0;

    if (available < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${Math.max(0, available)}, requested: ${dto.quantity}`,
      );
    }

    const lockKey = `variant:${dto.variantId}`;
    const lockId = `${userId}:${Date.now()}`;
    const hasLock = await this.redisLock.acquire(lockKey, lockId, 5);
    if (!hasLock) {
      throw new BadRequestException('Variant is busy, try again');
    }

    try {
      let cart = await this.prisma.cart.findFirst({
        where: { userId, status: 'active' },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId, status: 'active' },
        });
      }

      const existingItem = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId: dto.variantId },
      });

      const price = typeof variant.price === 'number'
        ? variant.price
        : variant.price.toNumber();

      if (existingItem) {
        const newQty = existingItem.quantity + dto.quantity;
        if (available < newQty) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${Math.max(0, available)}, total requested: ${newQty}`,
          );
        }

        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: dto.variantId,
            quantity: dto.quantity,
            priceSnapshot: price,
          },
        });
      }

      return this.getActiveCart(userId);
    } finally {
      await this.redisLock.release(lockKey, lockId);
    }
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateItemDto,
  ): Promise<CartResponseDto> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        variant: { include: { inventory: true } },
      },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    const inventory = item.variant.inventory;
    const available = inventory
      ? inventory.quantity - inventory.reserved
      : 0;

    if (available < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${Math.max(0, available)}, requested: ${dto.quantity}`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return this.getActiveCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getActiveCart(userId);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: 'active' },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { message: 'Cart cleared successfully' };
  }
}
