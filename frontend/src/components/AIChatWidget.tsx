import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, X, Send, Bot, Sparkles, Mic, MicOff } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { apiClient } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";


const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

interface Message {
  id: string;
  message: string;
  isBot: boolean;
  createdAt?: string;
  recommendations?: any[];
  suggestedActions?: string[];
}

const AIChatWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleActionClick = (action: string, recommendations: any[] = []) => {
    if (action === 'Checkout') {
      navigate('/cart');
      return;
    }
    if (action === 'Add All to Cart') {
      if (recommendations && recommendations.length > 0) {
        recommendations.forEach(prod => {
          addToCart({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            imageUrl: prod.imageUrl || '/assets/logo.png',
            description: prod.description || '',
            vendorId: prod.vendorId || '',
            stock: prod.stock || 10,
            category: prod.category || '',
            status: prod.status || 'active',
            createdAt: prod.createdAt || '',
            updatedAt: prod.updatedAt || ''
          } as any);
        });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          message: "Successfully added all recommended items to your cart! 🛒",
          isBot: true
        }]);
      }
      return;
    }
    handleShoppingAssistant(action);
  };

  const [ticketId, setTicketId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Try Google Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Unauthenticated local fallback bot
  const handleShoppingAssistant = async (msg: string) => {
    const newMessage = { id: Date.now().toString(), message: msg, isBot: false };
    
    // Calculate the history array BEFORE setting state (so we have the exact snapshot)
    const historyPayload = messages.map(m => ({ role: m.isBot ? 'assistant' : 'user', content: m.message }));
    historyPayload.push({ role: 'user', content: msg });

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);
    
    try {
      const res: any = await apiClient.post("/ai/chat", { messages: historyPayload });
      if (res.success && res.data) {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          message: res.data.reply, 
          isBot: true,
          recommendations: res.data.recommendations,
          suggestedActions: res.data.suggestedActions
        }]);

        // Auto-escalation trigger
        if (res.data.shouldEscalate && user) {
          try {
            const ticketRes: any = await apiClient.get("/support/ticket");
            if (ticketRes.ticket) {
              setTicketId(ticketRes.ticket.id);
            }
          } catch (err) {
            console.error("Failed to escalate support ticket", err);
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        message: "I'm having trouble connecting to my brain right now. Try again?", 
        isBot: true 
      }]);
    } finally {
      setIsTyping(false);
    }
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

    // If support ticket has been escalated, send via websocket directly (only if socket is actively connected)
    if (socket && socket.connected && ticketId && user) {
      socket.emit("support:message", {
        ticketId,
        senderId: user.id,
        message: inputValue,
        isBot: false
      });
      // Optimistically add user message to list
      setMessages(prev => [...prev, { id: Date.now().toString(), message: inputValue, isBot: false }]);
      setInputValue("");
      return;
    }


    // Otherwise, route to AI Shopping Assistant
    handleShoppingAssistant(inputValue);
  };


  const quickReplies = [
    "I need ingredients for jollof rice",
    "Birthday gift under 50k",
    "Find nearest pharmacy",
  ];

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        className="fixed bottom-[90px] lg:bottom-6 right-4 lg:right-6"
        style={{
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
        className="fixed bottom-[90px] lg:bottom-6 right-4 lg:right-6 w-[calc(100vw-32px)] sm:w-[370px]"
        style={{
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
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {msg.recommendations.map((prod: any) => (
                      <div key={prod.id} style={{ minWidth: 120, background: '#f8fafc', borderRadius: 8, padding: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                        <div style={{ color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>₦{prod.price}</div>
                        <button
                          onClick={() => {
                            addToCart({
                              id: prod.id,
                              name: prod.name,
                              price: prod.price,
                              imageUrl: prod.imageUrl || '/assets/logo.png',
                              description: prod.description || '',
                              vendorId: prod.vendorId || '',
                              stock: prod.stock || 10,
                              category: prod.category || '',
                              status: prod.status || 'active',
                              createdAt: prod.createdAt || '',
                              updatedAt: prod.updatedAt || ''
                            } as any);
                            setMessages(prev => [...prev, {
                              id: Date.now().toString(),
                              message: `Added ${prod.name} to cart! 🛒`,
                              isBot: true
                            }]);
                          }}
                          style={{ marginTop: 8, width: '100%', background: '#15803d', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 0', fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {msg.suggestedActions.map((action, i) => (
                      <button key={i} onClick={() => handleActionClick(action, msg.recommendations)} style={{ padding: '4px 10px', fontSize: '0.7rem', background: '#e2e8f0', border: 'none', borderRadius: 12, cursor: 'pointer', color: '#334155' }}>{action}</button>
                    ))}
                  </div>
                )}

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
                  onClick={() => handleShoppingAssistant(q)}
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
                placeholder={isRecording ? "Listening..." : "Type a message..."}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: 80,
                  fontSize: "0.8125rem",
                  borderRadius: 24,
                  border: "1.5px solid #e2e8f0",
                  background: isRecording ? "#f0fdf4" : "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  transition: "all 0.2s",
                  boxSizing: "border-box",
                }}
                disabled={isRecording}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(21,128,61,0.1)"; e.currentTarget.style.background = "#fff"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#f8fafc"; }}
              />
              
              {/* Voice Microphone Search Button */}
              <button
                type="button"
                onClick={toggleRecording}
                style={{
                  position: "absolute",
                  right: 42,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: isRecording ? "linear-gradient(135deg, #dc2626, #f87171)" : "transparent",
                  color: isRecording ? "#fff" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  boxShadow: isRecording ? "0 2px 8px rgba(220,38,38,0.3)" : "none",
                }}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isRecording}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: inputValue.trim() && !isRecording ? "linear-gradient(135deg, #15803d, #22c55e)" : "#cbd5e1",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: inputValue.trim() && !isRecording ? "pointer" : "default",
                  transition: "all 0.25s",
                  boxShadow: inputValue.trim() && !isRecording ? "0 2px 8px rgba(21,128,61,0.3)" : "none",
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
