import {
  Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentIntentDto } from './dto/payment-intent.dto';
import { PaymentConfirmDto } from './dto/payment-confirm.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { HmacWebhookGuard } from './guards/hmac-webhook.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':orderId/intent')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ description: 'Payment intent created' })
  async createIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: PaymentIntentDto,
  ) {
    return this.paymentsService.createIntent(user.id, orderId, dto);
  }

  @Post(':orderId/confirm')
  @ApiBearerAuth('bearer')
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Payment confirmed' })
  async confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: PaymentConfirmDto,
  ) {
    return this.paymentsService.confirmPayment(user.id, orderId, dto);
  }

  @Post('webhooks/mock')
  @Public()
  @UseGuards(HmacWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Mock webhook processed' })
  async webhook(@Body() dto: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }
}
