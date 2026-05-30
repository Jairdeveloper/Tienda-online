export interface PaymentIntentResult {
  provider: string;
  providerPaymentId?: string;
  status: string;
  amount: number;
  currency: string;
  rawResponse: Record<string, unknown>;
}

export interface PaymentConfirmResult {
  status: string;
  providerPaymentId?: string;
  rawResponse: Record<string, unknown>;
}

export interface PaymentRefundResult {
  status: string;
  rawResponse: Record<string, unknown>;
}

export interface PaymentProvider {
  createIntent(
    order: { id: string; total: number; currency: string },
    options?: Record<string, unknown>,
  ): Promise<PaymentIntentResult>;

  confirm(
    payment: { id: string; provider: string | null; providerPaymentId: string | null; amount: number | null },
    data: Record<string, unknown>,
  ): Promise<PaymentConfirmResult>;

  refund(
    payment: { id: string; provider: string | null; providerPaymentId: string | null; amount: number | null },
    refundAmount?: number,
  ): Promise<PaymentRefundResult>;
}
