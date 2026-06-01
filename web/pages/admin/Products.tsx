import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import type { Product, PaginatedResponse } from "../../types/catalog";
import Pagination from "../../components/catalog/Pagination";

export default function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("q", search);

  const { data, isLoading } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin-products", page, search],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<Product>>(
        `/admin/products?${params}`,
      );
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Nuevo Producto
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                SKU
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                Nombre
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">
                Categorías
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">
                Estado
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Cargando...
                </td>
              </tr>
            )}
            {data?.items.map((product: Product) => (
              <tr
                key={product.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 font-mono text-xs text-gray-900">
                  {product.sku}
                </td>
                <td className="py-3 px-4 text-gray-900 font-medium">
                  {product.name}
                </td>
                <td className="py-3 px-4 text-gray-500 text-xs">
                  {Array.isArray(product.categories)
                    ? product.categories.join(", ")
                    : "-"}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() =>
                      navigate(`/admin/products/${product.id}/edit`)
                    }
                    className="text-primary-600 hover:text-primary-800 text-xs font-medium mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(`¿Eliminar producto "${product.name}"?`)
                      ) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Sin productos
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
