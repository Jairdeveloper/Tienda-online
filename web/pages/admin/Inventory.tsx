import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import type { PaginatedResponse } from "../../types/catalog";
import type { InventoryItem, UpdateInventoryInput } from "../../types/admin";
import Pagination from "../../components/catalog/Pagination";
import TableSkeleton from "../../components/shared/TableSkeleton";

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editSafetyStock, setEditSafetyStock] = useState(0);

  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
  });
  if (lowStockOnly) params.set("lowStock", "true");

  const { data, isLoading } = useQuery<PaginatedResponse<InventoryItem>>({
    queryKey: ["admin-inventory", page, lowStockOnly],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<InventoryItem>>(
        `/admin/inventory?${params}`,
      );
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      variantId,
      input,
    }: {
      variantId: string;
      input: UpdateInventoryInput;
    }) => {
      const { data } = await client.patch(
        `/admin/inventory/${variantId}`,
        input,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      setEditing(null);
    },
  });

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setEditQuantity(item.quantity);
    setEditSafetyStock(item.safetyStock);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventario</h1>

      <div className="flex items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Solo bajo stock
        </label>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Producto
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  SKU Variante
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Cantidad
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Reservado
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Disponible
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Stock Seguridad
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7}>
                    <TableSkeleton rows={5} columns={7} />
                  </td>
                </tr>
              )}
              {data?.items.map((item) => (
                <tr
                  key={item.variantId}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    item.available < item.safetyStock ? "bg-red-50" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-gray-900 font-medium">
                    {item.variant.product.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">
                    {item.variant.sku}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    {item.reserved}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {item.available}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    {item.safetyStock}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-gray-500 font-medium mb-1">
                      No se encontraron resultados
                    </p>
                    <p className="text-sm text-gray-400">
                      {lowStockOnly
                        ? "No hay variantes con bajo stock."
                        : "No hay inventario registrado."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Editar Inventario — {editing.variant.sku}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {editing.variant.product.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Seguridad
                </label>
                <input
                  type="number"
                  value={editSafetyStock}
                  onChange={(e) => setEditSafetyStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  updateMutation.mutate({
                    variantId: editing.variantId,
                    input: {
                      quantity: editQuantity,
                      safetyStock: editSafetyStock,
                    },
                  })
                }
                disabled={updateMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
