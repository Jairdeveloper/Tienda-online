import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { Cart } from "../types/catalog";
import type { Address } from "../components/address/types";
import type { CheckoutResponse, CheckoutRequest } from "../types/orders";
import AddressForm from "../components/address/AddressForm";
import type { AddressFormData } from "../components/address/types";

const STEPS = ["Resumen", "Dirección", "Pago", "Confirmar"];

function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

export default function CheckoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mock" | "cod">("mock");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const {
    data: cart,
    isLoading: cartLoading,
    isError: cartError,
  } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await client.get<Cart>("/cart");
      return data;
    },
    enabled: isAuthenticated,
  });

  const {
    data: addresses,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await client.get<Address[]>("/users/me/addresses");
      return data;
    },
    enabled: isAuthenticated && step >= 1,
  });

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!cartLoading && cart && cart.items.length === 0 && !cartError) {
      navigate("/cart", { replace: true });
    }
  }, [cart, cartLoading, cartError, navigate]);

  const checkoutMutation = useMutation({
    mutationFn: async (body: CheckoutRequest) => {
      const { data } = await client.post<CheckoutResponse>("/checkout", body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${data.orderId}`, {
        state: { checkoutSuccess: true },
      });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (
              err as {
                response: { data: { message?: string; statusCode?: number } };
              }
            ).response?.data?.message || "Error al procesar el pedido"
          : "Error al procesar el pedido";
      setErrorMessage(msg);
    },
  });

  async function handleAddressCreate(data: AddressFormData) {
    await client.post("/users/me/addresses", data);
    setShowAddressForm(false);
    refetchAddresses();
  }

  function handleSubmit() {
    setErrorMessage("");
    checkoutMutation.mutate({
      addressId: selectedAddressId || undefined,
      paymentMethod,
      idempotencyKey,
    });
  }

  function canGoNext(): boolean {
    if (step === 0) return true;
    if (step === 1) return !!selectedAddressId;
    if (step === 2) return !!paymentMethod;
    return true;
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <nav
        className="flex items-center justify-center mb-8"
        aria-label="Progreso"
      >
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                i === step
                  ? "bg-primary-100 text-primary-700"
                  : i < step
                    ? "bg-green-100 text-green-700"
                    : "text-gray-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === step
                    ? "bg-primary-600 text-white"
                    : i < step
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? "\u2713" : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  i < step ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      {cartLoading && step === 0 && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center"
          role="alert"
        >
          <p className="font-medium">Error al cargar el carrito</p>
        </div>
      )}

      {cart && cart.items.length > 0 && (
        <>
          {step === 0 && (
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del pedido
              </h2>
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.variantName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.qty} x ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 ml-4">
                      ${(item.qty * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ${cart.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dirección de envío
              </h2>

              {addressesLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              )}

              {!addressesLoading && addresses && addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {addr.street}
                            {addr.number ? ` #${addr.number}` : ""}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state}, {addr.zipCode}
                          </p>
                          <p className="text-sm text-gray-500">
                            {addr.country}
                          </p>
                          {addr.isDefault && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!addressesLoading &&
                addresses &&
                addresses.length === 0 &&
                !showAddressForm && (
                  <p className="text-sm text-gray-500 mb-4">
                    No tienes direcciones guardadas. Agrega una para continuar.
                  </p>
                )}

              {showAddressForm ? (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Nueva dirección
                  </h3>
                  <AddressForm
                    onSubmit={handleAddressCreate}
                    onCancel={() => setShowAddressForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Agregar nueva dirección
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Método de pago
              </h2>
              <div className="space-y-3">
                <label
                  className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === "mock"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock"
                      checked={paymentMethod === "mock"}
                      onChange={() => setPaymentMethod("mock")}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Mock (pago simulado)
                      </p>
                      <p className="text-sm text-gray-500">
                        Pago de prueba — no se realizará un cobro real.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`block border rounded-lg p-4 cursor-pointer transition-colors ${
                    paymentMethod === "cod"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        Contra reembolso (COD)
                      </p>
                      <p className="text-sm text-gray-500">
                        Paga en efectivo cuando recibas tu pedido.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white shadow-md rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Confirmar pedido
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Artículos
                    </h3>
                    {cart.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm py-1"
                      >
                        <span className="text-gray-600">
                          {item.productName} ({item.variantName}) x{item.qty}
                        </span>
                        <span className="text-gray-900 font-medium">
                          ${(item.qty * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 mt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedAddressId && addresses && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        Dirección de envío
                      </h3>
                      {(() => {
                        const addr = addresses.find(
                          (a) => a.id === selectedAddressId,
                        );
                        if (!addr) return null;
                        return (
                          <p className="text-sm text-gray-600">
                            {addr.street}
                            {addr.number ? ` #${addr.number}` : ""}, {addr.city}
                            , {addr.state}, {addr.zipCode}
                          </p>
                        );
                      })()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Método de pago
                    </h3>
                    <p className="text-sm text-gray-600">
                      {paymentMethod === "mock"
                        ? "Mock (pago simulado)"
                        : "Contra reembolso (COD)"}
                    </p>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={checkoutMutation.isPending}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkoutMutation.isPending ? (
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
                    Procesando...
                  </>
                ) : (
                  "Confirmar Pedido"
                )}
              </button>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => {
                setStep((s) => Math.max(0, s - 1));
                setErrorMessage("");
              }}
              disabled={step === 0 || checkoutMutation.isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Anterior
            </button>
            {step < 3 && (
              <button
                onClick={() => {
                  setStep((s) => s + 1);
                  setErrorMessage("");
                }}
                disabled={!canGoNext()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                Continuar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
