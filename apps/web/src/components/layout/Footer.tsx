export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Tienda Online
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Tu tienda de confianza para productos de calidad.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Enlaces
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <a
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Inicio
                </a>
              </li>
              <li>
                <a
                  href="/cart"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Carrito
                </a>
              </li>
              <li>
                <a
                  href="/orders"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Pedidos
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Soporte
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <a
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            &copy; {year} Tienda Online. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
