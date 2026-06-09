import { createContext, useState } from "react";
import type { ToastContextType, ToastState, ToastType } from "@/types/api";

export const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const clearToast = () => setToast(null);

  const showToast = (
    message: string,
    type: ToastType = "success"
  ) => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 30000); // 30 seconds
  };

  return (
    <ToastContext.Provider
      value={{
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};