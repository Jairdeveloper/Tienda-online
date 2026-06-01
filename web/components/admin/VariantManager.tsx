import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";
import type { ProductVariant } from "../../types/catalog";
import type { CreateVariantInput, UpdateVariantInput } from "../../types/admin";

interface Props {
  productId: string;
  variants: ProductVariant[];
}

export default function VariantManager({ productId, variants }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateVariantInput>({
    sku: "",
    price: 0,
    listPrice: undefined,
    barcode: "",
    initialStock: 0,
    attributes: {},
  });
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");

  const resetForm = () => {
    setForm({
      sku: "",
      price: 0,
      listPrice: undefined,
      barcode: "",
      initialStock: 0,
      attributes: {},
    });
    setAttrKey("");
    setAttrVal("");
    setShowForm(false);
    setEditingId(null);
  };

  const openEdit = (v: ProductVariant) => {
    setForm({
      sku: v.sku,
      price: v.price,
      listPrice: v.listPrice,
      barcode: v.barcode,
      attributes: v.attributes || {},
    });
    setEditingId(v.id);
    setShowForm(true);
  };

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

  const createMutation = useMutation({
    mutationFn: async (data: CreateVariantInput) => {
      const { data: res } = await client.post(
        `/admin/products/${productId}/variants`,
        data,
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVariantInput;
    }) => {
      const { data: res } = await client.patch(`/admin/variants/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/admin/variants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Variantes</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          Agregar Variante
        </button>
      </div>

      {/* Variants table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-500">SKU</th>
              <th className="text-right py-2 font-medium text-gray-500">
                Precio
              </th>
              <th className="text-right py-2 font-medium text-gray-500">
                Precio Lista
              </th>
              <th className="text-left py-2 font-medium text-gray-500">
                Atributos
              </th>
              <th className="text-left py-2 font-medium text-gray-500">
                Código Barras
              </th>
              <th className="text-right py-2 font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className="border-b border-gray-100">
                <td className="py-2 font-mono text-xs text-gray-900">
                  {v.sku}
                </td>
                <td className="py-2 text-right text-gray-900">
                  ${v.price.toFixed(2)}
                </td>
                <td className="py-2 text-right text-gray-500">
                  {v.listPrice ? `$${v.listPrice.toFixed(2)}` : "-"}
                </td>
                <td className="py-2 text-gray-500 max-w-[200px] truncate">
                  {v.attributes
                    ? Object.entries(v.attributes)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(", ")
                    : "-"}
                </td>
                <td className="py-2 font-mono text-xs text-gray-500">
                  {v.barcode || "-"}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => openEdit(v)}
                    className="text-primary-600 hover:text-primary-800 text-xs font-medium mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("¿Eliminar variante?"))
                        deleteMutation.mutate(v.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-4 text-center text-gray-400 text-sm"
                >
                  Sin variantes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => resetForm()}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? "Editar Variante" : "Agregar Variante"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Lista
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.listPrice || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        listPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={form.barcode || ""}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={form.initialStock || 0}
                    onChange={(e) =>
                      setForm({ ...form, initialStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

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
                {form.attributes &&
                  Object.entries(form.attributes).length > 0 && (
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
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!form.sku || !form.price) return;
                  if (editingId) {
                    updateMutation.mutate({ id: editingId, data: form });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
