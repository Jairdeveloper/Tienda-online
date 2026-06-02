import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import type { Order } from "../../types/orders";
import type { UpdateOrderStatusInput } from "../../types/admin";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";

const STATUS_OPTIONS = [
  { value: "paid", label: "Pagado" },
  { value: "fulfilled", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "payment_failed", label: "Pago Fallido" },
];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data } = await client.get<Order>(`/admin/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: async (input: UpdateOrderStatusInput) => {
      const { data } = await client.patch<Order>(
        `/admin/orders/${id}/status`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setStatus("");
      setReason("");
      setError("");
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al actualizar estado"
          : "Error al actualizar estado";
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    const input: UpdateOrderStatusInput = {
      status: status as UpdateOrderStatusInput["status"],
    };
    if (reason) input.reason = reason;
    mutation.mutate(input);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pedido no encontrado
        </h2>
        <Link
          to="/admin/orders"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/admin/orders" className="hover:text-primary-600">
          Pedidos
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">
          #{order.id.substring(0, 8)}
        </span>
      </nav>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Pedido #{order.id.substring(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">Usuario: {order.userId}</span>
          <span className="text-2xl font-bold text-gray-900">
            ${order.total.toFixed(2)}{" "}
            <span className="text-sm font-normal text-gray-500">
              {order.currency}
            </span>
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
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
                <tr key={item.id} className="border-b border-gray-100">
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

      {/* Payments */}
      {order.payments && order.payments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h2>
          <div className="space-y-3">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {payment.provider}
                  </p>
                  <p className="text-sm text-gray-500">{payment.status}</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${payment.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update status form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actualizar Estado
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuevo Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Seleccionar...</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Motivo del cambio de estado..."
            />
          </div>
          <button
            type="submit"
            disabled={!status || mutation.isPending}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {mutation.isPending ? "Actualizando..." : "Actualizar Estado"}
          </button>
        </form>
      </div>
    </div>
  );
}
