import type { Address } from "./types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900">
              {address.street}
              {address.number ? ` #${address.number}` : ""}
            </p>
            {address.isDefault && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                Principal
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {address.city}, {address.state}, {address.zipCode}
          </p>
          <p className="text-sm text-gray-500">{address.country}</p>
        </div>
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => onEdit(address)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Editar dirección"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(address.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Eliminar dirección"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
