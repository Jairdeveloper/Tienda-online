import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import type { Prisma } from '@prisma/client';
import { OrderStatus, TERMINAL_STATUSES } from '../orders/enum/order-status.enum';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly inventoryService: InventoryService,
  ) {}

  async listOrders(query: AdminOrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

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
              variant: { include: { product: true } },
            },
          },
          payments: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
        payments: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (TERMINAL_STATUSES.includes(order.status as OrderStatus)) {
      throw new BadRequestException(`Cannot change status: order is in terminal status ${order.status}`);
    }

    const newStatus = dto.status as OrderStatus;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (newStatus === OrderStatus.PAID || newStatus === OrderStatus.FULFILLED) {
        for (const item of order.items) {
          await this.inventoryService.confirmDeduction(item.variantId, item.qty, tx as any);
        }
      }

      if (newStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await this.inventoryService.releaseStock(item.variantId, item.qty, tx as any);
        }
      }

      await tx.auditLog.create({
        data: {
          tableName: 'orders',
          recordId: orderId,
          action: 'admin_status_change',
          userId: adminId,
          diff: { previousStatus: order.status, newStatus, reason: dto.reason },
        },
      });
    });

    return this.getOrder(orderId);
  }

  async listProducts(query: { page?: number; limit?: number; q?: string; isActive?: boolean }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categories: { include: { category: true } },
          variants: { include: { inventory: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: { include: { category: true } },
        variants: { include: { inventory: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    const { categoryIds, ...data } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...data,
        attributes: data.attributes as any,
        metadata: data.metadata as any,
        categories: categoryIds?.length
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: {
        categories: { include: { category: true } },
        variants: { include: { inventory: true } },
      },
    });

    return product;
  }

  async updateProduct(productId: string, dto: UpdateProductDto, adminId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException('Product not found');

    const { categoryIds, ...data } = dto;

    const product = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId } });
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId, categoryId })),
          });
        }
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: data as any,
        include: {
          categories: { include: { category: true } },
          variants: { include: { inventory: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'products',
          recordId: productId,
          action: 'update',
          userId: adminId,
          diff: { previous: existing, updated: data } as any,
        },
      });

      return updated;
    });

    return product;
  }

  async deleteProduct(productId: string, adminId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw new NotFoundException('Product not found');

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.product.update({
        where: { id: productId },
        data: { deletedAt: new Date(), isActive: false },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'products',
          recordId: productId,
          action: 'delete',
          userId: adminId,
          diff: { deleted: true, previousStatus: existing.isActive },
        },
      });
    });

    return { deleted: true };
  }

  async createVariant(productId: string, dto: CreateVariantDto, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const { initialStock, ...variantData } = dto;

    const variant = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.productVariant.create({
        data: {
          ...variantData,
          productId,
          attributes: variantData.attributes as any,
          inventory: initialStock !== undefined
            ? { create: { quantity: initialStock, reserved: 0, safetyStock: 0 } }
            : { create: { quantity: 0, reserved: 0, safetyStock: 0 } },
        },
        include: { inventory: true },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'product_variants',
          recordId: created.id,
          action: 'create',
          userId: adminId,
          diff: { sku: created.sku, price: created.price, productId } as any,
        },
      });

      return created;
    });

    return variant;
  }

  async updateVariant(variantId: string, dto: UpdateVariantDto, adminId: string) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException('Variant not found');

    const { initialStock, ...data } = dto;

    const variant = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: data as any,
        include: { inventory: true },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'product_variants',
          recordId: variantId,
          action: 'update',
          userId: adminId,
          diff: { previous: existing, updated: data } as any,
        },
      });

      return updated;
    });

    return variant;
  }

  async deleteVariant(variantId: string, adminId: string) {
    const existing = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException('Variant not found');

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.inventory.deleteMany({ where: { variantId } });
      await tx.productVariant.delete({ where: { id: variantId } });

      await tx.auditLog.create({
        data: {
          tableName: 'product_variants',
          recordId: variantId,
          action: 'delete',
          userId: adminId,
          diff: { sku: existing.sku },
        },
      });
    });

    return { deleted: true };
  }

  async listInventory(query: { page?: number; limit?: number; lowStock?: boolean }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    let where: Record<string, unknown> = {};
    if (query.lowStock) {
      const lowStockIds = await this.prisma.$queryRaw<Array<{ variant_id: string }>>`
        SELECT variant_id FROM inventory
        WHERE quantity > 0
          AND (quantity - reserved) < safety_stock
      `;
      where = { variantId: { in: lowStockIds.map((r) => r.variant_id) } };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          variant: { include: { product: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateInventory(variantId: string, dto: UpdateInventoryDto, adminId: string) {
    const inventory = await this.prisma.inventory.findUnique({ where: { variantId } });
    if (!inventory) throw new NotFoundException('Inventory not found for variant');

    const updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const result = await tx.inventory.update({
        where: { variantId },
        data: dto,
        include: { variant: { include: { product: true } } },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'inventory',
          recordId: variantId,
          action: 'update',
          userId: adminId,
          diff: { previous: inventory, updated: dto } as any,
        },
      });

      return result;
    });

    return updated;
  }
}
