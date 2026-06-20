import { X } from "lucide-react";
import { useContext } from "react";
import { ToastContext, type ToastContextType } from "@/contexts/ToastContext";

export const GlobalToast = () => {
  const context = useContext(ToastContext) as ToastContextType | null;

  if (!context || !context.toast) return null;

  const { toast, clearToast } = context;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white animate-in slide-in-from-right
      ${
        toast.type === "success"
          ? "bg-green-600"
          : "bg-red-600"
      }`}
    >
      <span>{toast.message}</span>

      <button
        onClick={clearToast}
        className="opacity-80 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
};