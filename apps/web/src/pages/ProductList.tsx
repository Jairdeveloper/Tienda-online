import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import type { Product, PaginatedResponse } from "../types/catalog";
import ProductGrid from "../components/catalog/ProductGrid";
import Pagination from "../components/catalog/Pagination";
import CategoryFilter from "../components/catalog/CategoryFilter";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const [searchInput, setSearchInput] = useState(q);

  const { data, isLoading, isError, error } = useQuery<
    PaginatedResponse<Product>
  >({
    queryKey: ["products", page, q, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sort", "name");
      params.set("order", "asc");
      if (q) params.set("q", q);
      if (categoryId) params.set("categoryId", categoryId);
      const { data } = await client.get<PaginatedResponse<Product>>(
        `/catalog/products?${params}`,
      );
      return data;
    },
    staleTime: 30_000,
  });

  const updateParams = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(overrides).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput, page: "1" });
  };

  const handleCategoryChange = (catId: string) => {
    updateParams({ categoryId: catId, page: "1" });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Catálogo de Productos
      </h1>

      <form onSubmit={handleSearch} className="mb-6" role="search">
        <label htmlFor="search" className="sr-only">
          Buscar productos
        </label>
        <div className="flex gap-2">
          <input
            id="search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      <div className="mb-6">
        <CategoryFilter selected={categoryId} onChange={handleCategoryChange} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/4" />
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
          <p className="font-medium">Error al cargar productos</p>
          <p className="text-sm mt-1">
            {error instanceof Error
              ? error.message
              : "Intenta de nuevo más tarde"}
          </p>
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            No se encontraron productos
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Intenta ajustar los filtros o términos de búsqueda.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <ProductGrid products={data.items} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
