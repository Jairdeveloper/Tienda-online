import { Injectable } from '@nestjs/common';
import type {
  PaymentProvider,
  PaymentIntentResult,
  PaymentConfirmResult,
  PaymentRefundResult,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createIntent(
    order: { id: string; total: number; currency: string },
    _options?: Record<string, unknown>,
  ): Promise<PaymentIntentResult> {
    const providerPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      provider: 'mock',
      providerPaymentId,
      status: 'pending',
      amount: order.total,
      currency: order.currency,
      rawResponse: {
        mock: true,
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
      status: 'paid',
      rawResponse: { approved: true, confirmedAt: new Date().toISOString() },
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
