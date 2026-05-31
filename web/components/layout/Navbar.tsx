import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <a href="/" className="text-xl font-bold text-primary-600">
            Tienda
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Inicio
            </a>
            <a
              href="/cart"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Carrito
            </a>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <a
                  href="/profile"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {user?.name || user?.email}
                </a>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 transition-colors"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Registrarse
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            aria-label="Abrir menú"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <a href="/" className="block text-gray-600 py-2">
              Inicio
            </a>
            <a href="/cart" className="block text-gray-600 py-2">
              Carrito
            </a>
            {isAuthenticated ? (
              <>
                <a href="/profile" className="block text-gray-600 py-2">
                  {user?.name || "Perfil"}
                </a>
                <button
                  onClick={logout}
                  className="block text-red-600 py-2 w-full text-left"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="block text-gray-600 py-2">
                  Iniciar sesión
                </a>
                <a
                  href="/register"
                  className="block text-primary-600 py-2 font-medium"
                >
                  Registrarse
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
