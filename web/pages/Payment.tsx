import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Order } from "../types/orders";
import type {
  PaymentIntentResponse,
  PaymentConfirmResponse,
} from "../types/payments";
import OrderStatusBadge from "../components/orders/OrderStatusBadge";

export default function Payment() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [intent, setIntent] = useState<PaymentIntentResponse | null>(null);
  const [intentLoading, setIntentLoading] = useState(true);
  const [intentError, setIntentError] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
  } = useQuery<Order>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await client.get<Order>(`/orders/${orderId}`);
      return data;
    },
    enabled: isAuthenticated && !!orderId,
  });

  useEffect(() => {
    if (!order || !isAuthenticated) return;

    if (order.status !== "payment_pending") {
      navigate(`/orders/${orderId}`, {
        replace: true,
        state: { paymentError: "Esta orden no está pendiente de pago" },
      });
      return;
    }

    let cancelled = false;

    async function createIntent() {
      setIntentLoading(true);
      setIntentError("");
      try {
        const { data } = await client.post<PaymentIntentResponse>(
          `/payments/${orderId}/intent`,
          { provider: "mock", metadata: {} },
        );
        if (!cancelled) setIntent(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response: { data: { message?: string } } }).response
                  ?.data?.message || "No se pudo procesar el pago"
              : "No se pudo procesar el pago";
          setIntentError(msg);
        }
      } finally {
        if (!cancelled) setIntentLoading(false);
      }
    }

    createIntent();

    return () => {
      cancelled = true;
    };
  }, [order, orderId, isAuthenticated, navigate]);

  async function handlePay() {
    setConfirmLoading(true);
    setConfirmError("");
    try {
      const providerPaymentId = `mock_pay_${Date.now()}`;
      const { data } = await client.post<PaymentConfirmResponse>(
        `/payments/${orderId}/confirm`,
        { providerPaymentId },
      );
      if (data.status === "paid") {
        navigate(`/orders/${orderId}`, {
          replace: true,
          state: { paymentSuccess: "Pago realizado exitosamente" },
        });
      } else {
        navigate(`/payment/result?orderId=${orderId}&status=failed`, {
          replace: true,
        });
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al confirmar el pago"
          : "Error al confirmar el pago";
      setConfirmError(msg);
    } finally {
      setConfirmLoading(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (orderLoading || intentLoading) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="bg-white shadow-md rounded-xl p-8 space-y-4">
            <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-12 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pedido no encontrado
        </h2>
        <p className="text-gray-500 mb-6">
          El pedido que buscas no existe o no tienes acceso.
        </p>
        <Link
          to="/orders"
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  if (intentError) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <svg
          className="w-16 h-16 text-red-400 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error de pago
        </h2>
        <p className="text-gray-500 mb-6">{intentError}</p>
        <Link
          to={`/orders/${orderId}`}
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Volver al pedido
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link to="/orders" className="hover:text-primary-600">
          Pedidos
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/orders/${orderId}`} className="hover:text-primary-600">
          #{order.id.substring(0, 8)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Pagar</span>
      </nav>

      <div className="bg-white shadow-md rounded-xl p-8">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-1">
            Pedido #{order.id.substring(0, 8)} &middot; {dateStr}
          </p>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-1">Total a pagar</p>
          <p className="text-4xl font-bold text-gray-900">
            ${(intent?.amount ?? order.total).toFixed(2)}{" "}
            <span className="text-xl font-normal text-gray-500">
              {intent?.currency ?? order.currency}
            </span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Pago con tarjeta (Simulación)
              </p>
              <p className="text-xs text-gray-500">
                Proveedor: {intent?.provider ?? "mock"} &middot; Pago simulado
                para pruebas
              </p>
            </div>
          </div>
        </div>

        {confirmError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
            role="alert"
          >
            {confirmError}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={confirmLoading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg text-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {confirmLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Procesando pago...
            </>
          ) : (
            `Pagar $${(intent?.amount ?? order.total).toFixed(2)}`
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Esta es una simulación de pago. No se realizará ningún cargo real.
        </p>
      </div>
    </div>
  );
}
