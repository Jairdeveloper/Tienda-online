import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('variants/:variantId')
  @ApiOkResponse({ description: 'Variant inventory availability' })
  async findVariantAvailability(
    @Param('variantId') variantId: string,
  ): Promise<{ variantId: string; available: number; quantity: number; reserved: number; safetyStock: number }> {
    return this.inventoryService.findVariantAvailability(variantId);
  }

  @Public()
  @Get('status')
  @ApiOkResponse({ description: 'Inventory module health check' })
  status(): { module: string; status: string } {
    return { module: 'inventory', status: 'ok' };
  }
}
