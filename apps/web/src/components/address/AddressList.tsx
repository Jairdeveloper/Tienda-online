import { useState, useEffect, useCallback } from "react";
import type { Address, AddressFormData } from "./types";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import client from "../../api/client";

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data } = await client.get<Address[]>("/users/me/addresses");
      setAddresses(data);
    } catch {
      setError("Error al cargar direcciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  async function handleCreate(formData: AddressFormData) {
    await client.post("/users/me/addresses", formData);
    setCreating(false);
    fetchAddresses();
  }

  async function handleUpdate(formData: AddressFormData) {
    if (!editing) return;
    await client.patch(`/users/me/addresses/${editing.id}`, formData);
    setEditing(null);
    fetchAddresses();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    await client.delete(`/users/me/addresses/${id}`);
    fetchAddresses();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Direcciones</h3>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Agregar dirección
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Nueva dirección
          </h4>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {editing && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Editar dirección
          </h4>
          <AddressForm
            address={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          No tienes direcciones guardadas.
        </p>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
