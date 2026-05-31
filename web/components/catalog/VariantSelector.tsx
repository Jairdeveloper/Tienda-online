import type { ProductVariant } from "../../types/catalog";

interface Props {
  variants: ProductVariant[];
  selectedId: string;
  onChange: (variant: ProductVariant) => void;
}

export default function VariantSelector({
  variants,
  selectedId,
  onChange,
}: Props) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-3">
      {variants.map((variant) => {
        const attrStr = Object.values(variant.attributes).join(" · ");
        return (
          <button
            key={variant.id}
            onClick={() => onChange(variant)}
            className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
              selectedId === variant.id
                ? "bg-primary-50 border-primary-500 ring-1 ring-primary-500"
                : "border-gray-200 hover:border-primary-300"
            }`}
            aria-pressed={selectedId === variant.id}
          >
            <span className="block font-medium text-gray-900">{attrStr}</span>
            <span className="block text-lg font-bold text-primary-600">
              ${variant.price.toFixed(2)}
              {variant.listPrice && variant.listPrice > variant.price && (
                <span className="ml-2 text-sm text-gray-400 line-through font-normal">
                  ${variant.listPrice.toFixed(2)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
