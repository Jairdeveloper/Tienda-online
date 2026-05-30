import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { HmacWebhookGuard } from './guards/hmac-webhook.guard';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { CodPaymentProvider } from './providers/cod-payment.provider';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    CodPaymentProvider,
    PaymentProviderFactory,
    HmacWebhookGuard,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
