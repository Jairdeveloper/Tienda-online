---
id: 008
area: api
type: API
module: payments
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - payments
  - payment-processing
  - webhook
summary: "Especificación de la API de pagos: creación de intents, confirmación, webhooks, patrón provider, eventos y manejo de stock."
keywords:
  - pagos
  - payments
  - webhooks
  - proveedores
  - provider-pattern
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Payments API — Payment Processing

## Base Path: `api/v1/payments`

Create intent and confirm require JWT. Webhook endpoint is @Public with HMAC guard.

## Endpoints

### `POST /payments/:orderId/intent`
- **Auth:** JWT required
- **Body:** `{ provider }` (provider: 'mock' | 'cod')
- Creates payment intent via selected provider
- Transitions order: stock_reserved → payment_pending
- Creates Payment record (status: pending)

### `POST /payments/:orderId/confirm`
- **Auth:** JWT required
- **Body:** `{ providerPaymentId? }`
- Confirms payment via provider
- On success: order → paid, stock deducted
- On failure: order → payment_failed

### `POST /payments/webhooks/mock`
- **Auth:** @Public + HmacWebhookGuard
- **Body:** `{ paymentId, providerPaymentId, event }`
- Events: payment.completed, payment.failed, payment.refunded
- Idempotency via Redis key `webhook:{providerPaymentId}` (24h TTL)

## Payment Provider Pattern

```
PaymentProvider (interface)
├── createIntent(order, options?) → PaymentIntentResult
├── confirm(payment, data) → PaymentConfirmResult
└── refund(payment, refundAmount?) → PaymentRefundResult
```

### Implementations

| Provider | createIntent | confirm | Use Case |
|----------|-------------|---------|----------|
| MockPaymentProvider | Generates mock IDs, returns pending | Returns paid | Development/testing |
| CodPaymentProvider | Generates COD IDs, returns cod_pending | Returns cod_pending | Cash on delivery |

### Factory

`PaymentProviderFactory.getProviderByString(provider)` maps 'mock' → MockPaymentProvider, 'cod' → CodPaymentProvider.

## Webhook Events

| Event | Effect | Stock |
|-------|--------|-------|
| payment.completed | Order → paid | Deducted |
| payment.failed | Order → payment_failed | Released |
| payment.refunded | Order → cancelled | Released |
