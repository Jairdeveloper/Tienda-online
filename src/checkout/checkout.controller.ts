import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('checkout')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: CheckoutResponseDto, description: 'Checkout completed' })
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutRequestDto,
  ): Promise<CheckoutResponseDto> {
    return this.checkoutService.checkout(user.id, dto);
  }
}
