import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Cart } from "../types/catalog";

export default function CartPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const {
    data: cart,
    isLoading,
    isError,
  } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await client.get<Cart>("/cart");
      return data;
    },
    enabled: isAuthenticated,
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      await client.patch(`/cart/items/${id}`, { qty });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/cart/items/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      await client.post("/cart/clear");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Carrito</h1>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded" />
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
          <p className="font-medium">Error al cargar el carrito</p>
        </div>
      )}

      {cart && cart.items.length === 0 && (
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
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium mb-4">
            Tu carrito está vacío
          </p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Explorar productos
          </Link>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <>
          <div className="space-y-4 mb-8">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white shadow-md rounded-xl p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    ${item.unitPrice.toFixed(2)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (item.qty <= 1) {
                        removeItem.mutate(item.id);
                      } else {
                        updateQty.mutate({ id: item.id, qty: item.qty - 1 });
                      }
                    }}
                    disabled={updateQty.isPending || removeItem.isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium text-gray-900">
                    {item.qty}
                  </span>
                  <button
                    onClick={() =>
                      updateQty.mutate({ id: item.id, qty: item.qty + 1 })
                    }
                    disabled={updateQty.isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-gray-900">
                    ${(item.qty * item.unitPrice).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem.mutate(item.id)}
                  disabled={removeItem.isPending}
                  className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50"
                  aria-label="Eliminar item"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white shadow-md rounded-xl p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                ${cart.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-6 pt-2 border-t border-gray-100">
              <span className="text-gray-900 font-medium">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ${cart.total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => clearCart.mutate()}
                disabled={clearCart.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {clearCart.isPending ? "Vaciando..." : "Vaciar carrito"}
              </button>
              <button
                onClick={() => navigate("/checkout")}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Proceder al checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
