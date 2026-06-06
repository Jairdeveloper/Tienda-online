import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useBotChat } from "../../hooks/useBotChat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatConfirmDialog from "./ChatConfirmDialog";
import ChatLoginPrompt from "./ChatLoginPrompt";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const {
    messages,
    status,
    pendingActionId,
    errorMessage,
    messagesEndRef,
    sendMessage,
    confirmAction,
    cancelAction,
    resetChat,
  } = useBotChat();

  // Extract page context for the bot by parsing the URL path
  const getPageContext = useCallback((): Record<string, unknown> => {
    const path = location.pathname;
    const context: Record<string, unknown> = {};

    // Match /products/:id
    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      context.currentProductId = productMatch[1];
    }

    if (path === "/cart") {
      context.currentCartId = "active";
    }

    // Match /orders/:id
    const orderMatch = path.match(/^\/orders\/([^/]+)$/);
    if (orderMatch) {
      context.currentOrderId = orderMatch[1];
    }

    if (path.startsWith("/admin")) {
      let section = "dashboard";
      if (path.includes("/orders")) section = "orders";
      else if (path.includes("/products")) section = "products";
      else if (path.includes("/inventory")) section = "inventory";
      context.adminSection = section;
    }

    return context;
  }, [location.pathname]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messagesEndRef]);

  const handleSend = useCallback(
    (text: string) => {
      const context = getPageContext();
      sendMessage(text, context);
    },
    [getPageContext, sendMessage],
  );

  const handleConfirm = useCallback(() => {
    confirmAction();
  }, [confirmAction]);

  const handleCancel = useCallback(() => {
    cancelAction();
  }, [cancelAction]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center
                   rounded-full bg-blue-600 text-white shadow-lg transition-all
                   hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat de asistencia"}
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
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
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-[calc(100%-2rem)] max-w-[360px]
                     flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl
                     transition-all duration-300"
          style={{ height: "520px", maxHeight: "calc(100vh - 180px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span className="text-sm font-semibold">Asistente B2B</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                className="rounded-lg p-1.5 transition-colors hover:bg-blue-500"
                aria-label="Reiniciar chat"
                title="Nueva conversación"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-blue-500"
                aria-label="Cerrar chat"
              >
                <svg
                  className="h-4 w-4"
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
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && status === "idle" && (
              <div className="flex h-full flex-col items-center justify-center text-center">
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
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  ¡Hola! Soy el asistente B2B
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Puedo ayudarte a buscar productos, consultar pedidos, y más.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}

            {/* Loading indicator */}
            {status === "loading" && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {status === "error" && errorMessage && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* requiresAuth prompt */}
            {status === "requiresAuth" && <ChatLoginPrompt />}

            <div ref={messagesEndRef} />
          </div>

          {/* Confirmation dialog overlay */}
          {status === "requiresConfirmation" && pendingActionId && (
            <ChatConfirmDialog
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              loading={false}
            />
          )}

          {/* Input area */}
          <ChatInput
            onSend={handleSend}
            disabled={status === "loading" || status === "requiresAuth"}
          />
        </div>
      )}
    </>
  );
}
