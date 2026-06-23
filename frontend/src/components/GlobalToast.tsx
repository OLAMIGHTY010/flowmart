import { useToast } from "@/contexts/ToastContext";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: { bg: "var(--color-primary-surface)", border: "var(--color-primary)", icon: "var(--color-primary)" },
  error: { bg: "#FEF2F2", border: "var(--color-accent-red)", icon: "var(--color-accent-red)" },
  info: { bg: "#EFF6FF", border: "var(--color-accent-blue)", icon: "var(--color-accent-blue)" },
  warning: { bg: "#FFFBEB", border: "var(--color-accent-amber)", icon: "var(--color-accent-amber)" },
};

export const GlobalToast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: "var(--z-toast)" as any,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      maxWidth: 380,
    }}>
      {toasts.map((toast) => {
        const IconComponent = iconMap[toast.type];
        const colors = colorMap[toast.type];

        return (
          <div
            key={toast.id}
            className="animate-slide-in-right"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <IconComponent size={20} style={{ color: colors.icon, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ flexShrink: 0, padding: 2, color: "var(--color-text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
