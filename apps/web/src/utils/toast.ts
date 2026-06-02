type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastMessage) => void;

let listener: ToastListener | null = null;
let idCounter = 0;

export function setToastListener(fn: ToastListener) {
  listener = fn;
}

export function showToast(message: string, type: ToastType = "info") {
  listener?.({ message, type });
}

export type { ToastType, ToastMessage };
export { idCounter };
