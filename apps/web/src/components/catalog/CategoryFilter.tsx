import { useQuery } from "@tanstack/react-query";
import client from "../../api/client";
import type { Category } from "../../types/catalog";

interface Props {
  selected: string;
  onChange: (categoryId: string) => void;
}

export default function CategoryFilter({ selected, onChange }: Props) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await client.get<Category[]>("/catalog/categories");
      return data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 bg-gray-200 animate-pulse rounded-full flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onChange("")}
        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
          !selected
            ? "bg-primary-600 text-white border-primary-600"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        Todas
      </button>
      {categories
        .filter((c) => c.isActive)
        .map((category) => (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
              selected === category.id
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {category.name}
          </button>
        ))}
    </div>
  );
}
