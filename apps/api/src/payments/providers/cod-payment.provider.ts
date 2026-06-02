import { Injectable } from '@nestjs/common';
import type {
  PaymentProvider,
  PaymentIntentResult,
  PaymentConfirmResult,
  PaymentRefundResult,
} from './payment-provider.interface';

@Injectable()
export class CodPaymentProvider implements PaymentProvider {
  async createIntent(
    order: { id: string; total: number; currency: string },
    _options?: Record<string, unknown>,
  ): Promise<PaymentIntentResult> {
    const providerPaymentId = `cod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      provider: 'cod',
      providerPaymentId,
      status: 'cod_pending',
      amount: order.total,
      currency: order.currency,
      rawResponse: {
        method: 'cod',
        timestamp: new Date().toISOString(),
        providerPaymentId,
      },
    };
  }

  async confirm(
    _payment: { id: string; provider: string | null; providerPaymentId: string | null; amount: number | null },
    _data: Record<string, unknown>,
  ): Promise<PaymentConfirmResult> {
    return {
      status: 'cod_pending',
      rawResponse: { confirmedAt: new Date().toISOString() },
    };
  }

  async refund(
    _payment: { id: string; provider: string | null; providerPaymentId: string | null; amount: number | null },
    refundAmount?: number,
  ): Promise<PaymentRefundResult> {
    return {
      status: 'refunded',
      rawResponse: { refunded: true, amount: refundAmount, timestamp: new Date().toISOString() },
    };
  }
}
