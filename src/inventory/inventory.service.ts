import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PrismaTransaction } from '../prisma/prisma.types';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantAvailability(variantId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { variantId },
    });

    if (!inventory) throw new NotFoundException('Inventory not found for variant');

    return {
      variantId: inventory.variantId,
      available: inventory.quantity - inventory.reserved,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
      safetyStock: inventory.safetyStock,
    };
  }

  async reserveStock(
    variantId: string,
    qty: number,
    tx?: PrismaTransaction,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    try {
      const result = await (client as any).$executeRaw`
        UPDATE inventory
        SET reserved = reserved + ${qty}
        WHERE variant_id = ${variantId}::uuid
          AND (quantity - reserved) >= ${qty}
      `;
      return result > 0;
    } catch {
      return false;
    }
  }

  async releaseStock(
    variantId: string,
    qty: number,
    tx?: PrismaTransaction,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await (client as any).$executeRaw`
      UPDATE inventory
      SET reserved = GREATEST(0, reserved - ${qty})
      WHERE variant_id = ${variantId}::uuid
    `;
  }

  async confirmDeduction(
    variantId: string,
    qty: number,
    tx?: PrismaTransaction,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await (client as any).$executeRaw`
      UPDATE inventory
      SET reserved = GREATEST(0, reserved - ${qty}),
          quantity = GREATEST(0, quantity - ${qty})
      WHERE variant_id = ${variantId}::uuid
    `;
  }
}
