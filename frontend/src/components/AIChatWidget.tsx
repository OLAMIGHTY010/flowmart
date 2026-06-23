import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { apiClient } from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

interface Message {
  id: string;
  message: string;
  isBot: boolean;
  createdAt?: string;
}

const AIChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Unauthenticated local fallback bot
  const handleLocalBot = (msg: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), message: msg, isBot: false }]);
    setInputValue("");
    setIsTyping(true);
    
    setTimeout(() => {
      let reply = "Please log in to speak to our live agents or to get detailed help regarding your orders and accounts.";
      const lower = msg.toLowerCase();
      if (lower.includes("vendor") || lower.includes("sell")) {
        reply = "To become a vendor, click 'Get Started' and select the Vendor role. You'll need to complete our KYC verification before you can start selling.";
      } else if (lower.includes("delivery") || lower.includes("fee")) {
        reply = "Delivery fees vary by zone. Log in and add items to your cart to see exact delivery fees to your location.";
      } else if (lower.includes("hello") || lower.includes("hi")) {
        reply = "Hello there! 👋 How can I help you today?";
      } else if (lower.includes("rider") || lower.includes("dispatch")) {
        reply = "Want to earn as a dispatch rider? Sign up via 'Get Started', select Rider, and complete the KYC onboarding to start receiving delivery requests.";
      } else if (lower.includes("payment") || lower.includes("pay")) {
        reply = "We support multiple payment methods including card payments and pay-on-delivery. All card payments are secured through Paystack.";
      } else if (lower.includes("track") || lower.includes("order")) {
        reply = "To track your order, please log in first. You'll find real-time tracking on your Orders page.";
      }

      setIsTyping(false);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), message: reply, isBot: true }]);
    }, 1200);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (isOpen && user && !ticketId) {
      const initTicket = async () => {
        try {
          const res: any = await apiClient.get("/support/ticket");
          if (res.ticket) {
            setTicketId(res.ticket.id);
            const histRes: any = await apiClient.get(`/support/ticket/${res.ticket.id}/messages`);
            if (histRes.messages) {
              setMessages(histRes.messages);
            }
          }
        } catch (error) {
          console.error("Failed to initialize support ticket", error);
        }
      };
      initTicket();
    } else if (isOpen && !user && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        message: "Hi there! 👋 I'm FlowMart's AI assistant. I can help with general questions about our platform. What would you like to know?",
        isBot: true
      }]);
    }
  }, [isOpen, user, ticketId]);

  useEffect(() => {
    if (ticketId && user) {
      const newSocket = io(API_URL, {
        query: { userId: user.id },
      });

      newSocket.on("connect", () => {
        newSocket.emit("support:join", { ticketId });
      });

      newSocket.on("support:message", (msg: Message) => {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [ticketId, user]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!user) {
      handleLocalBot(inputValue);
      return;
    }

    if (socket && ticketId) {
      socket.emit("support:message", {
        ticketId,
        senderId: user.id,
        message: inputValue,
        isBot: false
      });
      setInputValue("");
    }
  };

  const quickReplies = !user ? [
    "How to sell?",
    "Delivery fees",
    "Track order",
  ] : [];

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
          color: "#fff",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(21,128,61,0.4)",
          transform: isOpen ? "scale(0)" : "scale(1)",
          opacity: isOpen ? 0 : 1,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <MessageSquare size={22} />
      </button>

      {/* ── Chat Window ── */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 370,
          height: 560,
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 9999,
          boxShadow: isOpen ? "0 20px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)" : "none",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.6) translateY(40px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "bottom right",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f5132 0%, #15803d 50%, #16a34a 100%)",
            padding: "18px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
            position: "relative",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -30, left: 40, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "0.01em", margin: 0 }}>FlowMart Assistant</h3>
              <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.75)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", display: "inline-block", animation: "pulse 2s infinite" }} />
                {user ? "Live Support Connected" : "AI Assistant • Online"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
              zIndex: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Messages Area ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 16px",
            background: "linear-gradient(180deg, #f0fdf4 0%, #f8fafc 30%)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              style={{
                display: "flex",
                flexDirection: msg.isBot ? "row" : "row-reverse",
                alignItems: "flex-end",
                gap: 8,
                width: "100%",
              }}
            >
              {/* Avatar for bot only */}
              {msg.isBot && (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #15803d, #22c55e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(21,128,61,0.25)",
                  }}
                >
                  <Bot size={14} color="#fff" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                  borderRadius: msg.isBot ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                  background: msg.isBot ? "#ffffff" : "linear-gradient(135deg, #15803d, #16a34a)",
                  color: msg.isBot ? "#334155" : "#ffffff",
                  border: msg.isBot ? "1px solid #e2e8f0" : "none",
                  boxShadow: msg.isBot
                    ? "0 1px 3px rgba(0,0,0,0.06)"
                    : "0 2px 8px rgba(21,128,61,0.3)",
                  wordBreak: "break-word",
                }}
              >
                {msg.message}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #15803d, #22c55e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bot size={14} color="#fff" />
              </div>
              <div
                style={{
                  padding: "12px 18px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px 16px 16px 4px",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0s" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
              </div>
            </div>
          )}

          {/* Quick Replies (Guest Mode only, only show after welcome) */}
          {!user && messages.length === 1 && quickReplies.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => handleLocalBot(q)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: 20,
                    border: "1.5px solid #15803d",
                    background: "transparent",
                    color: "#15803d",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#15803d"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div
          style={{
            padding: "14px 16px",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: 44,
                  fontSize: "0.8125rem",
                  borderRadius: 24,
                  border: "1.5px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  transition: "all 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(21,128,61,0.1)"; e.currentTarget.style.background = "#fff"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f8fafc"; }}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: inputValue.trim() ? "linear-gradient(135deg, #15803d, #22c55e)" : "#cbd5e1",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: inputValue.trim() ? "pointer" : "default",
                  transition: "all 0.25s",
                  boxShadow: inputValue.trim() ? "0 2px 8px rgba(21,128,61,0.3)" : "none",
                }}
              >
                <Send size={14} style={{ marginLeft: 1 }} />
              </button>
            </div>
          </form>
          {!user && (
            <p style={{ textAlign: "center", fontSize: "0.625rem", color: "#94a3b8", marginTop: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
              🔒 Log in to connect with live agents
            </p>
          )}
        </div>
      </div>

      {/* Keyframes for typing animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
};

export default AIChatWidget;
