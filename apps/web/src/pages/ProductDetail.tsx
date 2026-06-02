import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Product } from "../types/catalog";
import VariantSelector from "../components/catalog/VariantSelector";
import StockIndicator from "../components/catalog/StockIndicator";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [addedMessage, setAddedMessage] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await client.get<Product>(`/catalog/products/${id}`);
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  const addToCart = useMutation({
    mutationFn: async (variantId: string) => {
      await client.post("/cart/items", { variantId, qty: 1 });
    },
    onSuccess: () => {
      setAddedMessage(true);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setTimeout(() => setAddedMessage(false), 3000);
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (!selectedVariantId) return;
    addToCart.mutate(selectedVariantId);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="aspect-square bg-gray-200 rounded-xl mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Producto no encontrado
        </h2>
        <p className="text-gray-500 mb-6">
          El producto que buscas no existe o ha sido eliminado.
        </p>
        <Link
          to="/products"
          className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link to="/products" className="hover:text-primary-600">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
          <svg
            className="w-24 h-24 text-gray-300"
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

        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {product.categories.map((cat) => (
              <span
                key={cat}
                className="text-xs bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-medium"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.description}
          </p>

          {product.variants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Variantes
              </h2>
              <VariantSelector
                variants={product.variants}
                selectedId={selectedVariantId}
                onChange={(v) => setSelectedVariantId(v.id)}
              />
            </div>
          )}

          {selectedVariantId && (
            <div className="mb-6">
              <StockIndicator variantId={selectedVariantId} />
            </div>
          )}

          <div className="space-y-3">
            {addedMessage && (
              <div
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                Producto agregado al carrito
              </div>
            )}

            {addToCart.isError && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
              >
                {addToCart.error instanceof Error
                  ? addToCart.error.message
                  : "Error al agregar al carrito"}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariantId || addToCart.isPending}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addToCart.isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Agregando...
                </>
              ) : isAuthenticated ? (
                "Agregar al carrito"
              ) : (
                "Iniciar sesión para comprar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
