export interface PaymentIntentRequest {
  provider: "mock" | "cod";
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResponse {
  paymentId: string | null;
  provider: string;
  status: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmRequest {
  providerPaymentId?: string;
}

export interface PaymentConfirmResponse {
  paymentId: string;
  status: string;
  orderStatus: string;
}
