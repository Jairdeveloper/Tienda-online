import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PaymentResult() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const isSuccess = status === "paid";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!orderId) {
      navigate("/orders", { replace: true });
    }
  }, [orderId, navigate]);

  if (authLoading || !isAuthenticated || !orderId) return null;

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="bg-white shadow-md rounded-xl p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago exitoso
            </h1>
            <p className="text-gray-500 mb-8">
              Tu pago ha sido procesado correctamente.
            </p>
            <Link
              to={`/orders/${orderId}`}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg text-lg font-semibold transition-colors"
            >
              Ver mi pedido
            </Link>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pago fallido
            </h1>
            <p className="text-gray-500 mb-8">
              El pago no pudo ser procesado. Intenta nuevamente.
            </p>
            <Link
              to={`/orders/${orderId}/pay`}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg text-lg font-semibold transition-colors"
            >
              Reintentar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
