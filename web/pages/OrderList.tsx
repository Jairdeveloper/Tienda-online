import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import type { PaginatedOrders, Order } from "../types/orders";
import OrderCard from "../components/orders/OrderCard";
import OrderStatusBadge from "../components/orders/OrderStatusBadge";
import Pagination from "../components/catalog/Pagination";

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "created", label: "Creados" },
  { value: "payment_pending", label: "Pago Pendiente" },
  { value: "paid", label: "Pagados" },
  { value: "fulfilled", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const ITEMS_PER_PAGE = 20;

export default function OrderList() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(ITEMS_PER_PAGE),
    sort: "createdAt",
    order: "desc",
  });
  if (statusFilter) {
    queryParams.set("status", statusFilter);
  }

  const { data, isLoading, isError } = useQuery<PaginatedOrders>({
    queryKey: ["orders", page, statusFilter],
    queryFn: async () => {
      const { data } = await client.get<PaginatedOrders>(
        `/orders?${queryParams.toString()}`,
      );
      return data;
    },
    enabled: isAuthenticated,
  });

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
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

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-5 animate-pulse"
            >
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center"
          role="alert"
        >
          <p className="font-medium">Error al cargar los pedidos</p>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-white shadow-md rounded-xl p-12 text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium mb-4">
            No tienes pedidos aún
          </p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="space-y-4">
            {data.items.map((order: Order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
