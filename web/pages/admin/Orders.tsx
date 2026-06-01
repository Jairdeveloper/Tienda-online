import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";
import type { PaginatedOrders, Order } from "../../types/orders";
import Pagination from "../../components/catalog/Pagination";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "created", label: "Creados" },
  { value: "payment_pending", label: "Pago Pendiente" },
  { value: "paid", label: "Pagados" },
  { value: "fulfilled", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "payment_failed", label: "Pago Fallido" },
];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    sort: "createdAt",
    order: "desc",
  });
  if (statusFilter) params.set("status", statusFilter);

  const { data, isLoading } = useQuery<PaginatedOrders>({
    queryKey: ["admin-orders", page, statusFilter],
    queryFn: async () => {
      const { data } = await client.get<PaginatedOrders>(
        `/admin/orders?${params}`,
      );
      return data;
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setStatusFilter(f.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                Order ID
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                Usuario
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">
                Total
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">
                Estado
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                Fecha
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {data?.items.map((order: Order) => (
              <tr
                key={order.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              >
                <td className="py-3 px-4 font-mono text-xs text-gray-900">
                  {order.id.substring(0, 8)}...
                </td>
                <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                  {order.userId.substring(0, 8)}...
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                  ${order.total.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-center">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleDateString("es-MX")}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/orders/${order.id}`);
                    }}
                    className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Sin pedidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
