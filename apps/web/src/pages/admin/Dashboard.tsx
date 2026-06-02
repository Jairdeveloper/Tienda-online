import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";
import type { PaginatedResponse } from "../../types/catalog";
import type { InventoryItem } from "../../types/admin";

export default function AdminDashboard() {
  const { data: ordersData } = useQuery<PaginatedResponse<unknown>>({
    queryKey: ["admin-orders-count"],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<unknown>>(
        "/admin/orders?limit=1",
      );
      return data;
    },
  });

  const { data: productsData } = useQuery<PaginatedResponse<unknown>>({
    queryKey: ["admin-products-count"],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<unknown>>(
        "/admin/products?limit=1",
      );
      return data;
    },
  });

  const { data: lowStockData } = useQuery<PaginatedResponse<InventoryItem>>({
    queryKey: ["admin-inventory-low-stock"],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<InventoryItem>>(
        "/admin/inventory?lowStock=true&limit=1",
      );
      return data;
    },
  });

  const cards = [
    {
      label: "Total Pedidos",
      value: ordersData?.total ?? "-",
      color: "bg-blue-500",
      icon: "📦",
    },
    {
      label: "Total Productos",
      value: productsData?.total ?? "-",
      color: "bg-green-500",
      icon: "🏷️",
    },
    {
      label: "Bajo Stock",
      value: lowStockData?.total ?? "-",
      color: "bg-red-500",
      icon: "⚠️",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-xl`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
