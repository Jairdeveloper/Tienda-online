import { Injectable } from '@nestjs/common';
import { MockPaymentProvider } from './mock-payment.provider';
import { CodPaymentProvider } from './cod-payment.provider';
import type { PaymentProvider } from './payment-provider.interface';

export type PaymentMethod = 'mock' | 'cod';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly mockProvider: MockPaymentProvider,
    private readonly codProvider: CodPaymentProvider,
  ) {}

  getProvider(method: PaymentMethod): PaymentProvider {
    switch (method) {
      case 'mock':
        return this.mockProvider;
      case 'cod':
        return this.codProvider;
      default:
        throw new Error(`Unknown payment provider: ${method}`);
    }
  }

  getProviderByString(provider: string): PaymentProvider {
    return this.getProvider(provider as PaymentMethod);
  }
}
