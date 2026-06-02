import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import type { Product, Category, PaginatedResponse } from "../../types/catalog";
import type { CreateProductInput, UpdateProductInput } from "../../types/admin";
import VariantManager from "../../components/admin/VariantManager";

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateProductInput>({
    sku: "",
    name: "",
    description: "",
    attributes: {},
    categoryIds: [],
  });
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");
  const [error, setError] = useState("");

  const { data: product } = useQuery<Product>({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data } = await client.get<Product>(`/admin/products/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const { data: categoriesData } = useQuery<PaginatedResponse<Category>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await client.get<PaginatedResponse<Category>>(
        "/catalog/categories",
      );
      return data;
    },
  });

  useEffect(() => {
    if (product && isEdit) {
      setForm({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        attributes: product.attributes || {},
        categoryIds: Array.isArray(product.categories)
          ? product.categories.filter(Boolean)
          : [],
      });
    }
  }, [product, isEdit]);

  const addAttr = () => {
    if (!attrKey) return;
    setForm((f) => ({
      ...f,
      attributes: { ...f.attributes, [attrKey]: attrVal },
    }));
    setAttrKey("");
    setAttrVal("");
  };

  const removeAttr = (key: string) => {
    const { [key]: _, ...rest } = form.attributes as Record<string, string>;
    setForm((f) => ({ ...f, attributes: rest }));
  };

  const toggleCategory = (catId: string) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds?.includes(catId)
        ? f.categoryIds.filter((c) => c !== catId)
        : [...(f.categoryIds || []), catId],
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const { data: res } = await client.post<Product>("/admin/products", data);
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate(`/admin/products/${res.id}/edit`);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al crear producto"
          : "Error al crear producto";
      setError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const { data: res } = await client.patch<Product>(
        `/admin/products/${id}`,
        data,
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      setError("");
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { message?: string } } }).response?.data
              ?.message || "Error al actualizar producto"
          : "Error al actualizar producto";
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku || !form.name) return;
    if (isEdit) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const categories = categoriesData?.items || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/admin/products" className="hover:text-primary-600">
          Productos
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">
          {isEdit ? `Editar: ${product?.name || ""}` : "Nuevo Producto"}
        </span>
      </nav>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {isEdit ? "Editar Producto" : "Nuevo Producto"}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías
            </label>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.categoryIds?.includes(cat.id) || false}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atributos
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Clave"
                value={attrKey}
                onChange={(e) => setAttrKey(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Valor"
                value={attrVal}
                onChange={(e) => setAttrVal(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addAttr}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                +
              </button>
            </div>
            {form.attributes && Object.entries(form.attributes).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(form.attributes).map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    {k}: {v as string}
                    <button
                      type="button"
                      onClick={() => removeAttr(k)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <Link
              to="/admin/products"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Variant Manager — only in edit mode */}
      {isEdit && product && (
        <div className="bg-white shadow rounded-lg p-6">
          <VariantManager productId={id!} variants={product.variants || []} />
        </div>
      )}
    </div>
  );
}
