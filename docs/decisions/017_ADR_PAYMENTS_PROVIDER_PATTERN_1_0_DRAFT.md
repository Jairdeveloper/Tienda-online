---
id: 017
area: decisions
type: ADR
module: payments
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies: []
tags:
  - adr
  - payments
  - provider-pattern
  - strategy
summary: "ADR sobre el patrón Strategy para proveedores de pago (PaymentProvider interface + Factory), incluyendo idempotencia y alternativas."
keywords:
  - adr
  - pagos
  - provider-pattern
  - strategy
  - factory
  - idempotencia
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# ADR: Payment Provider Pattern (Strategy)

## Status

Accepted

## Context

The payment system must:
1. Support multiple payment methods (credit card, PayPal, cash on delivery)
2. Be extensible — new providers should be addable without changing core logic
3. Have a default mock provider for development and testing
4. Support webhooks for asynchronous payment status updates
5. Handle idempotency for webhook processing

## Decision

Use the **Strategy Pattern** via a `PaymentProvider` interface and `PaymentProviderFactory`.

### Architecture

```
PaymentProvider (interface)
├── createIntent(order, options?) → PaymentIntentResult
├── confirm(payment, data) → PaymentConfirmResult
└── refund(payment, refundAmount?) → PaymentRefundResult

Implementations:
├── MockPaymentProvider  — Auto-approves all payments, for dev/test
└── CodPaymentProvider   — Cash on delivery, status stays cod_pending

Factory:
└── PaymentProviderFactory
    └── getProviderByString('mock' | 'cod') → PaymentProvider
```

### Idempotency

- Checkout: Redis key `checkout:{userId}:{idempotencyKey}`, 24h TTL
- Webhook: Redis key `webhook:{providerPaymentId}`, 24h TTL
- Prevents duplicate processing from network retries

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|----------------|
| Single monolithic payment service | Violates Open/Closed principle, hard to extend |
| Webhook-only (no polling) | Sufficient for async flows, but intent+confirm needed |
| Event-driven (message queue) | Overkill for current scale, adds operational complexity |

## Consequences

### Positive
- New providers added by implementing interface + registering in factory
- Mock provider enables development without real payment accounts
- Webhook idempotency prevents double-processing
- Clean separation of concerns

### Negative
- Factory must know about all providers (DI registration needed)
- Webhook HMAC verification adds complexity
- Async payment flow requires webhook endpoint exposure

## Adding a New Provider

1. Create `src/payments/providers/{name}-payment.provider.ts`
2. Implement `PaymentProvider` interface
3. Register in `PaymentProviderFactory`
4. Register as provider in `PaymentsModule`
5. Write unit tests (see `mock-payment.provider.spec.ts`)

## Related

- Interface: src/payments/providers/payment-provider.interface.ts
- Factory: src/payments/providers/payment-provider.factory.ts
- Mock: src/payments/providers/mock-payment.provider.ts
- COD: src/payments/providers/cod-payment.provider.ts
- Webhook guard: src/payments/guards/hmac-webhook.guard.ts
