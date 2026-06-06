import { Link } from "react-router-dom";

export default function ChatLoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium text-gray-800">
        Inicia sesión para continuar
      </p>
      <p className="mb-4 text-xs text-gray-500">
        Necesitas iniciar sesión para realizar esta acción
      </p>
      <Link
        to="/login"
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white
                   shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Ir a iniciar sesión
      </Link>
    </div>
  );
}
