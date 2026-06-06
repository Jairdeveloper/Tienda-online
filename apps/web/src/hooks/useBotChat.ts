import { useState, useCallback, useRef } from "react";
import {
  sendBotMessage,
  confirmBotAction,
  type BotResponse,
} from "../api/bot";

export type Message = {
  role: "user" | "bot";
  text: string;
  sources?: { type: string; title: string }[];
};

export type ChatStatus =
  | "idle"
  | "loading"
  | "error"
  | "requiresAuth"
  | "requiresConfirmation";

export interface ChatState {
  messages: Message[];
  status: ChatStatus;
  pendingActionId: string | null;
  sessionId: string;
  errorMessage: string | null;
}

const SESSION_KEY = "tienda_bot_session_id";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    // sessionStorage may be unavailable (SSR, privacy mode)
  }
  const newId = crypto.randomUUID();
  try {
    sessionStorage.setItem(SESSION_KEY, newId);
  } catch {
    // non-critical
  }
  return newId;
}

export function useBotChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use ref for sessionId to avoid stale closures in async callbacks
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleBotResponse = useCallback(
    (response: BotResponse) => {
      // Sync sessionId if server returned a different one
      if (response.sessionId && response.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = response.sessionId;
        try {
          sessionStorage.setItem(SESSION_KEY, response.sessionId);
        } catch {
          // non-critical
        }
      }

      // Add bot message
      const botMsg: Message = {
        role: "bot",
        text: response.reply,
        sources: response.sources,
      };

      if (response.requiresConfirmation && response.pendingActionId) {
        setMessages((prev) => [...prev, botMsg]);
        setStatus("requiresConfirmation");
        setPendingActionId(response.pendingActionId);
      } else {
        setMessages((prev) => [...prev, botMsg]);
        setStatus("idle");
        setPendingActionId(null);
      }
      setErrorMessage(null);
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string, context?: Record<string, unknown>) => {
      if (!text.trim()) return;

      // Add user message immediately
      addMessage({ role: "user", text });
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await sendBotMessage(
          text,
          sessionIdRef.current,
          context,
        );
        handleBotResponse(response);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const isAuthError =
          axiosErr?.response?.status === 401 ||
          axiosErr?.response?.status === 403;

        setStatus(isAuthError ? "requiresAuth" : "error");
        setErrorMessage(
          isAuthError
            ? "Necesitas iniciar sesión para realizar esta acción"
            : axiosErr?.response?.data?.message ||
                "Error al conectar con el asistente",
        );
      }
    },
    [addMessage, handleBotResponse],
  );

  const confirmAction = useCallback(
    async (text?: string) => {
      setStatus("loading");
      setErrorMessage(null);

      try {
        const response = await confirmBotAction(
          sessionIdRef.current,
          text,
        );
        handleBotResponse(response);
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        const isAuthError =
          axiosErr?.response?.status === 401 ||
          axiosErr?.response?.status === 403;

        setStatus(isAuthError ? "requiresAuth" : "error");
        setErrorMessage(
          isAuthError
            ? "Necesitas iniciar sesión para realizar esta acción"
            : axiosErr?.response?.data?.message ||
                "Error al confirmar la acción",
        );
      }
    },
    [handleBotResponse],
  );

  const cancelAction = useCallback(() => {
    setStatus("idle");
    setPendingActionId(null);
    addMessage({
      role: "bot",
      text: "Acción cancelada. ¿Hay algo más en que pueda ayudarte?",
    });
  }, [addMessage]);

  const resetChat = useCallback(() => {
    sessionIdRef.current = getOrCreateSessionId();
    setMessages([]);
    setStatus("idle");
    setPendingActionId(null);
    setErrorMessage(null);
  }, []);

  return {
    messages,
    status,
    pendingActionId,
    sessionId: sessionIdRef.current,
    errorMessage,
    messagesEndRef,
    sendMessage,
    confirmAction,
    cancelAction,
    resetChat,
  };
}
