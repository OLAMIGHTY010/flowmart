import { createContext } from "react";

export interface Toast {
  type: "success" | "error";
  message: string;
}

export interface ToastContextType {
  toast: Toast | null;
  showToast: (toast: Toast) => void;
  clearToast: () => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
