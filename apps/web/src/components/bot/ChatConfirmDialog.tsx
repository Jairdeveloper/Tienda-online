interface ChatConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ChatConfirmDialog({
  onConfirm,
  onCancel,
  loading,
}: ChatConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar acción"
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar acción
          </h3>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Esta acción realizará cambios en el sistema. ¿Estás seguro de que
          deseas continuar?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm
                       font-medium text-gray-700 transition-colors
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium
                       text-white shadow-sm transition-colors
                       hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
