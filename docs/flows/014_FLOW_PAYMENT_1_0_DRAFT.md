---
id: 014
area: flows
type: FLOW
module: payments
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 008
tags:
  - flow
  - payment
  - processing
  - webhook
summary: "Diagramas de flujo de pagos: creación de intent, confirmación, procesamiento de webhooks y máquina de estados de órdenes."
keywords:
  - flujo
  - pagos
  - payments
  - webhook
  - estados
  - orden
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Payment Flow

## Payment Intent Flow

```
Client         PaymentsService    PaymentProvider    Prisma       Redis
  │                  │                  │               │            │
  │ POST payments/   │                  │               │            │
  │ :orderId/intent  │                  │               │            │
  │─────────────────►│                  │               │            │
  │                  │  Validate order  │               │            │
  │                  │  + ownership     │               │            │
  │                  │───────────────────────────────►│            │
  │                  │◄── order ──────────────────────│            │
  │                  │                  │               │            │
  │                  │  Check status =  │               │            │
  │                  │  stock_reserved  │               │            │
  │                  │                  │               │            │
  │                  │  getProvider()   │               │            │
  │                  │─────────────────►│               │            │
  │                  │                  │               │            │
  │                  │  createIntent()  │               │            │
  │                  │─────────────────►│               │            │
  │                  │◄── intentResult  │               │            │
  │                  │                  │               │            │
  │                  │  ┌─ TRANSACTION ─┐              │            │
  │                  │  │ Create Payment│              │            │
  │                  │  │ (pending)     │              │            │
  │                  │  │ Update Order  │              │            │
  │                  │  │→pay_pending   │              │            │
  │                  │  └───────────────┘              │            │
  │                  │───────────────────────────────►│            │
  │  { paymentId,   │                  │               │            │
  │    provider,    │                  │               │            │
  │    status }     │                  │               │            │
  │◄────────────────│                  │               │            │
```

## Payment Confirmation Flow

```
Client         PaymentsService    PaymentProvider    Prisma       Redis
  │                  │                  │               │            │
  │ POST payments/   │                  │               │            │
  │ :orderId/confirm │                  │               │            │
  │─────────────────►│                  │               │            │
  │                  │  Validate order  │               │            │
  │                  │  + status        │               │            │
  │                  │  pay_pending     │               │            │
  │                  │───────────────────────────────►│            │
  │                  │                  │               │            │
  │                  │  confirm()       │               │            │
  │                  │─────────────────►│               │            │
  │                  │◄── result        │               │            │
  │                  │  (paid/failed)   │               │            │
  │                  │                  │               │            │
  │                  │  ┌─ TRANSACTION ─┐              │            │
  │                  │  │ Update Payment│              │            │
  │                  │  │ Update Order  │              │            │
  │                  │  │→paid/failed   │              │            │
  │                  │  │ If paid:      │              │            │
  │                  │  │ Deduct stock  │              │            │
  │                  │  │ Create audit  │              │            │
  │                  │  └───────────────┘              │            │
  │                  │───────────────────────────────►│            │
  │                  │                  │               │            │
  │  { paymentId,   │                  │               │            │
  │    status,      │                  │               │            │
  │    orderStatus }│                  │               │            │
  │◄────────────────│                  │               │            │
```

## Webhook Processing

```
Provider         PaymentsService    InventoryService    Prisma       Redis
  │                  │                   │               │            │
  │ POST webhooks/   │                   │               │            │
  │ mock             │                   │               │            │
  │─────────────────►│                   │               │            │
  │                  │  Idempotency check│               │            │
  │                  │─────────────────────────────────────────────►│
  │                  │◄── exists? ──────────────────────────────────│
  │                  │                   │               │            │
  │                  │  Find payment     │               │            │
  │                  │───────────────────────────────►│            │
  │                  │                   │               │            │
  │                  │  Switch event:    │               │            │
  │                  │                   │               │            │
  │  completed ─────►│  Update Payment→paid             │            │
  │                  │  Update Order→paid                │            │
  │                  │  Confirm stock deduction         │            │
  │                  │─────────────────────►│           │            │
  │                  │                   │               │            │
  │  failed ────────►│  Update Payment→failed            │            │
  │                  │  Update Order→payment_failed      │            │
  │                  │                   │               │            │
  │  refunded ──────►│  Update Payment→refunded          │            │
  │                  │  Update Order→cancelled           │            │
  │                  │  Release stock                   │            │
  │                  │─────────────────────►│           │            │
  │                  │                   │               │            │
  │                  │  Store idempotency│               │            │
  │                  │─────────────────────────────────────────────►│
  │                  │                   │               │            │
  │◄── { message } ──│                   │               │            │
```

## Order Status Machine

```
created
   │
   ▼
stock_reserved ◄──────┐
   │                   │
   ▼                   │
payment_pending        │
   │                   │
   ├─────► paid ────► fulfilled
   │         │
   └─────► payment_failed ──► cancelled
   │                            ▲
   └─────► cod_pending ────────┘
```
