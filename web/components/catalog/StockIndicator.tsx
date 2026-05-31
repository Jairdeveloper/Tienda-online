import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";
import type { InventoryInfo } from "../../types/catalog";

interface Props {
  variantId: string;
}

export default function StockIndicator({ variantId }: Props) {
  const { data, isLoading, isError } = useQuery<InventoryInfo>({
    queryKey: ["inventory", variantId],
    queryFn: async () => {
      const { data } = await client.get<InventoryInfo>(
        `/catalog/inventory/${variantId}`,
      );
      return data;
    },
    enabled: !!variantId,
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300 animate-pulse" />
        <span className="text-sm text-gray-400">Verificando stock...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-500">Stock no disponible</span>
      </div>
    );
  }

  if (data.available <= 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="text-sm text-red-600 font-medium">Agotado</span>
      </div>
    );
  }

  if (data.available <= 10) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="text-sm text-yellow-600 font-medium">
          Últimas unidades ({data.available} restantes)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
      <span className="text-sm text-green-600 font-medium">En stock</span>
    </div>
  );
}
