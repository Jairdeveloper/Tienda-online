---
id: 035
area: frontend
type: EXEC
module: frontend
version: "1.0"
status: DRAFT
tags:
  - frontend
  - payments
  - execution
  - fase4
summary: "Implementación de la Fase 4 (Pagos) del frontend SPA. Agrega flujo completo de pago mock: creación de intent, confirmación, polling de estado y pantalla de resultados."
keywords:
  - frontend
  - payments
  - payment-intent
  - payment-confirm
  - polling
  - react
  - phase-4
changelog:
  - version: "1.0"
    date: 2026-05-31
    author: frontend-reviewer
    changes:
      - "Creación de tipos PaymentIntentRequest, PaymentIntentResponse, PaymentConfirmRequest, PaymentConfirmResponse"
      - "Página Payment.tsx con flujo intent -> confirm mock"
      - "Página PaymentResult.tsx con estados éxito/fallo"
      - "Polling de estado de pago en OrderDetail cada 3s (máx 30 intentos)"
      - "Botón Pagar ahora en OrderDetail para payment_pending"
      - "Nuevas rutas /orders/:orderId/pay y /payment/result"
---

# Fase 4: Pagos — Implementación Frontend

## Resumen

Implementación del flujo de pagos mock en el frontend SPA. Consta de 3 nuevas piezas:

| Archivo                       | Propósito                                       |
| ----------------------------- | ----------------------------------------------- |
| `web/types/payments.ts`       | Interfaces TypeScript para el contrato de pagos |
| `web/pages/Payment.tsx`       | Página de pago con flujo intent -> confirm      |
| `web/pages/PaymentResult.tsx` | Pantalla de resultado (éxito/fallo)             |
| `web/pages/OrderDetail.tsx`   | Botón Pagar ahora + polling de estado           |
| `web/routes/index.tsx`        | Nuevas rutas de pago                            |

## Cambios realizados

### 4.1 Payment Page (`web/pages/Payment.tsx`)

- Ruta: `/orders/:orderId/pay`
- Requiere autenticación (redirect a `/login` si no)
- Al montar: verifica que el status de la orden sea `payment_pending`
- Llama a `POST /payments/:orderId/intent` con `{ provider: "mock", metadata: {} }`
- Muestra monto, orden, método de pago y botón "Pagar $XX.XX"
- Al hacer click: genera `providerPaymentId = mock_pay_${Date.now()}` y llama a `POST /payments/:orderId/confirm`
- En éxito: redirect a `/orders/:orderId` con mensaje de éxito
- En fallo: redirect a `/payment/result?orderId=xxx&status=failed`
- Maneja estados: loading (skeleton), error del servidor, orden no pendiente

### 4.2 Payment Result (`web/pages/PaymentResult.tsx`)

- Ruta: `/payment/result?orderId=xxx&status=paid|failed`
- Éxito: check verde + "Pago exitoso" + botón "Ver mi pedido"
- Fallo: X roja + "Pago fallido" + botón "Reintentar"

### 4.3 Payment Polling (en OrderDetail)

- Cuando `order.status === 'payment_pending'` se inicia polling cada 3s
- Máximo 30 intentos (90 segundos)
- Indicador animado "Verificando pago..." durante polling
- Si supera intentos: mensaje "La verificación está tardando más de lo esperado"
- Se limpia al desmontar o cuando cambia el status

### 4.4 Botón Pagar ahora (en OrderDetail)

- Visible solo cuando `status === 'payment_pending'`
- Navega a `/orders/:orderId/pay`
- Estilo: `bg-primary-600`, hover, rounded-lg

## Rutas nuevas

| Ruta                   | Componente          |
| ---------------------- | ------------------- |
| `/orders/:orderId/pay` | `<Payment />`       |
| `/payment/result`      | `<PaymentResult />` |

## Tipos TypeScript

Definidos en `web/types/payments.ts`:

- `PaymentIntentRequest`: `{ provider: 'mock' \| 'cod', metadata?: Record<string, unknown> }`
- `PaymentIntentResponse`: `{ paymentId, provider, status, amount, currency }`
- `PaymentConfirmRequest`: `{ providerPaymentId?: string }`
- `PaymentConfirmResponse`: `{ paymentId, status, orderStatus }`
