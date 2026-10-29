import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Bike, 
  Phone, 
  CheckCheck, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Smile 
} from "lucide-react";
import { apiClient } from "@/services/api";

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: "buyer" | "rider";
  senderName: string;
  content: string;
  timestamp: string;
}

interface RiderChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  orderRef?: string;
}

const PRESET_QUICK_MESSAGES = [
  "I'm waiting downstairs / at the gate 🚪",
  "Please ring/call me once you arrive 📞",
  "Please leave with the security / front desk 🏢",
  "Take your time and ride safe! 🛵",
  "What color is your bike/helmet? 🔍",
];

export const RiderChatDrawer: React.FC<RiderChatDrawerProps> = ({
  isOpen,
  onClose,
  orderId,
  riderName = "FlowMart Courier",
  riderPhone,
  riderVehicle = "Honda CB 125 • Express Delivery",
  orderRef,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-courier-welcome",
      orderId,
      senderId: "rider-system",
      senderRole: "rider",
      senderName: riderName,
      content: `Hello! I'm ${riderName}, assigned to deliver your order. I will arrive shortly!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Poll for messages every 3s
  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchMessages = async () => {
      try {
        const res: any = await apiClient.get(`/orders/${orderId}/messages`);
        if (res?.messages && res.messages.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, Message>();
            prev.forEach((m) => map.set(m.id, m));
            res.messages.forEach((m: Message) => map.set(m.id, m));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          });
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, orderId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      orderId,
      senderId: "current-user",
      senderRole: "buyer",
      senderName: "You",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setIsSending(true);

    try {
      await apiClient.post(`/orders/${orderId}/messages`, {
        content: text,
        senderRole: "buyer",
        senderName: "Customer",
      });
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          height: "85vh",
          maxHeight: 700,
          backgroundColor: "var(--color-bg-primary, #ffffff)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -20px 40px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border, #e2e8f0)",
            backgroundColor: "var(--color-bg-secondary, #f8fafc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "var(--color-primary-surface, #eef2ff)",
                color: "var(--color-primary, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Bike size={22} />
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  border: "2px solid #ffffff",
                }}
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--color-text-primary, #0f172a)" }}>
                  {riderName}
                </h3>
                <span
                  style={{
                    fontSize: "0.688rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 9999,
                    backgroundColor: "#ecfdf5",
                    color: "#059669",
                  }}
                >
                  On the Way
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #64748b)", margin: "2px 0 0 0" }}>
                {riderVehicle} {orderRef ? `• Ref: #${orderRef}` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {riderPhone && (
              <a
                href={`tel:${riderPhone}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "var(--color-bg-primary, #ffffff)",
                  border: "1px solid var(--color-border, #e2e8f0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary, #4f46e5)",
                  textDecoration: "none",
                }}
                title="Call Courier"
              >
                <Phone size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "var(--color-bg-primary, #ffffff)",
                border: "1px solid var(--color-border, #e2e8f0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted, #64748b)",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Safety & Escrow Banner */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f3ff",
            borderBottom: "1px solid #ede9fe",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.75rem",
            color: "#6d28d9",
          }}
        >
          <ShieldCheck size={15} style={{ flexShrink: 0 }} />
          <span>Keep communications within FlowMart. Do NOT share your 4-digit PIN in chat!</span>
        </div>

        {/* Message Feed */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            backgroundColor: "var(--color-bg-primary, #ffffff)",
          }}
        >
          {messages.map((msg) => {
            const isMe = msg.senderRole === "buyer";
            const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    backgroundColor: isMe
                      ? "var(--color-primary, #4f46e5)"
                      : "var(--color-bg-secondary, #f1f5f9)",
                    color: isMe ? "#ffffff" : "var(--color-text-primary, #0f172a)",
                    fontSize: "0.875rem",
                    lineHeight: 1.45,
                    boxShadow: isMe ? "0 4px 12px rgba(79, 70, 229, 0.15)" : "none",
                  }}
                >
                  {msg.content}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.688rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    marginTop: 3,
                    padding: "0 4px",
                  }}
                >
                  <span>{formattedTime}</span>
                  {isMe && <CheckCheck size={13} style={{ color: "var(--color-primary, #4f46e5)" }} />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Quick Chips */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--color-bg-secondary, #f8fafc)",
            borderTop: "1px solid var(--color-border, #e2e8f0)",
            display: "flex",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {PRESET_QUICK_MESSAGES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 9999,
                border: "1px solid var(--color-border, #cbd5e1)",
                backgroundColor: "var(--color-bg-primary, #ffffff)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-secondary, #334155)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: "12px 16px 20px 16px",
            borderTop: "1px solid var(--color-border, #e2e8f0)",
            backgroundColor: "var(--color-bg-primary, #ffffff)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="Type a message to your courier..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 14,
              border: "1.5px solid var(--color-border, #e2e8f0)",
              backgroundColor: "var(--color-bg-secondary, #f8fafc)",
              fontSize: "0.875rem",
              color: "var(--color-text-primary, #0f172a)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "var(--color-primary, #4f46e5)",
              color: "#ffffff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: !inputText.trim() || isSending ? "not-allowed" : "pointer",
              opacity: !inputText.trim() || isSending ? 0.5 : 1,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RiderChatDrawer;
