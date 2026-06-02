import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Tienda Online</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Tu tienda de confianza. Explora nuestro catálogo de productos con los
        mejores precios.
      </p>

      {isAuthenticated ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          Bienvenido, {user?.name || user?.email}
        </div>
      ) : (
        <div className="flex gap-4">
          <a
            href="/login"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Iniciar Sesión
          </a>
          <a
            href="/register"
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Registrarse
          </a>
        </div>
      )}

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">API Status</h2>
        <p className="text-sm text-gray-500">
          Conectado a: {import.meta.env.VITE_API_BASE_URL || "/api/v1"}
        </p>
      </div>
    </div>
  );
}
