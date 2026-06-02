import { useAuth } from "../../contexts/AuthContext";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/inventory", label: "Inventario" },
];

const userLinks = [
  { href: "/", label: "Inicio" },
  { href: "/cart", label: "Carrito" },
  { href: "/orders", label: "Mis pedidos" },
  { href: "/profile", label: "Perfil" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAuthenticated, user } = useAuth();
  const isAdmin =
    user?.roles?.includes("admin") || user?.roles?.includes("operator");

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary-600">Tienda</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navegación
          </p>
          {userLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
            >
              {link.label}
            </a>
          ))}

          {isAdmin && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-2">
                Admin
              </p>
              {adminLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  {link.label}
                </a>
              ))}
            </>
          )}
        </nav>

        {isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
        )}
      </aside>
    </>
  );
}
