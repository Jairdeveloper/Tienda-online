import { Link } from "react-router-dom";
import type { Product } from "../../types/catalog";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {product.categories.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>
        <p className="text-lg font-bold text-gray-900 mt-3">
          ${product.minPrice.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
