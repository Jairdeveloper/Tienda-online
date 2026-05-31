import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Order } from "../types/orders";
import OrderStatusBadge from "../components/orders/OrderStatusBadge";

const CANCELLABLE_STATUSES = ["created", "stock_reserved", "payment_pending"];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const checkoutSuccess = location.state?.checkoutSuccess;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    checkoutSuccess ? "¡Pedido creado exitosamente!" : "",
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await client.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: isAuthenticated && !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post<Order>(`/orders/${id}/cancel`, {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowCancelModal(false);
      setCancelError("");
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al cancelar el pedido"
          : "Error al cancelar el pedido";
      setCancelError(msg);
    },
  });

  function handleCancel() {
    setCancelError("");
    cancelMutation.mutate();
  }

  function isCancellable(): boolean {
    return order ? CANCELLABLE_STATUSES.includes(order.status) : false;
  }

  function getPaymentPending(): boolean {
    return order?.status === "payment_pending";
  }

  const dateStr = order
    ? new Date(order.createdAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="bg-white shadow-md rounded-xl p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
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

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link to="/orders" className="hover:text-primary-600">
          Pedidos
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Detalle pedido</span>
      </nav>

      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Pedido #{order.id.substring(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            ${order.total.toFixed(2)}{" "}
            <span className="text-sm font-normal text-gray-500">
              {order.currency}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Artículos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">
                  Producto
                </th>
                <th className="text-left py-2 font-medium text-gray-500">
                  SKU
                </th>
                <th className="text-center py-2 font-medium text-gray-500">
                  Cant.
                </th>
                <th className="text-right py-2 font-medium text-gray-500">
                  Precio
                </th>
                <th className="text-right py-2 font-medium text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-3 text-gray-900 font-medium">
                    {item.productName}
                  </td>
                  <td className="py-3 text-gray-500 font-mono text-xs">
                    {item.sku}
                  </td>
                  <td className="py-3 text-center text-gray-900">{item.qty}</td>
                  <td className="py-3 text-right text-gray-900">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-900">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {order.payments && order.payments.length > 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h2>
          <div className="space-y-3">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {payment.provider}
                  </p>
                  <p className="text-sm text-gray-500">{payment.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
          role="alert"
        >
          {cancelError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {getPaymentPending() && (
          <button className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Pagar ahora
          </button>
        )}
        {isCancellable() && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar Pedido
          </button>
        )}
      </div>

      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCancelModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cancelación"
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cancelar pedido
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar este pedido? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {cancelMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
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
                    Cancelando...
                  </>
                ) : (
                  "Sí, cancelar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
