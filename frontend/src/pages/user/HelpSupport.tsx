import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HeadphonesIcon, Search, MessageCircle, Bot, Mail, Phone, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import { UserInput } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { coreServices } from "@/services/CoreServices";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/services/api";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : "http://localhost:5000";

export default function HelpSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activeChat, setActiveChat] = useState<'admin' | 'bot' | null>(null);

  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: () => coreServices.getFaqs(),
  });

  // Init Admin Chat
  useEffect(() => {
    if (activeChat === 'admin' && user && !ticketId) {
      const initChat = async () => {
        try {
          const res = await apiClient.get<{ success: boolean; ticket: { id: string } }>('/support/ticket');
          if (res.success) {
            setTicketId(res.ticket.id);
            const histRes = await apiClient.get<{ success: boolean; messages: any[] }>(`/support/ticket/${res.ticket.id}/messages`);
            if (histRes.success) setMessages(histRes.messages);
          }
        } catch (err) {
          console.error("Failed to init chat", err);
        }
      };
      initChat();
    }
  }, [activeChat, user, ticketId]);

  useEffect(() => {
    if (activeChat === 'admin' && ticketId && user) {
      const newSocket = io(SOCKET_URL, { query: { userId: user.id } });
      setSocket(newSocket);
      newSocket.emit('support:join', { ticketId });
      newSocket.on('support:message', (msg: any) => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      });
      return () => { newSocket.disconnect(); };
    }
  }, [activeChat, ticketId, user]);

  useEffect(() => {
    if (activeChat === 'bot' && messages.length === 0) {
      setMessages([{ id: '1', message: 'Hello! I am FlowBot, your AI assistant. How can I help you today?', isBot: true }]);
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMsg = inputMsg;
    setInputMsg('');

    if (activeChat === 'admin') {
      if (socket && ticketId) {
        socket.emit('support:message', {
          ticketId,
          senderId: user?.id,
          message: userMsg,
          isBot: false
        });
      }
    } else if (activeChat === 'bot') {
      setMessages(prev => [...prev, { id: Date.now().toString(), message: userMsg, isBot: false }]);
      try {
        const res = await apiClient.post<{ success: boolean; message: string; recommendations?: any[] }>('/ai/chat', { message: userMsg });
        if (res.success) {
          setMessages(prev => [...prev, { id: Date.now().toString(), message: res.message, isBot: true }]);
        }
      } catch (err) {
        setMessages(prev => [...prev, { id: Date.now().toString(), message: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
      }
    }
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-[600px] max-w-2xl mx-auto bg-gray-50">
        <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100 shadow-sm">
          <button onClick={() => { setActiveChat(null); setMessages([]); setTicketId(null); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
            <ArrowLeft size={20} />
          </button>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${activeChat === 'admin' ? 'bg-primary' : 'bg-purple-500'}`}>
            {activeChat === 'admin' ? <HeadphonesIcon size={20} /> : <Bot size={20} />}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{activeChat === 'admin' ? 'Live Support' : 'FlowBot AI'}</h2>
            <p className="text-xs text-green-600 font-medium">Online now</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isMe = !msg.isBot && msg.senderId === user?.id || (activeChat === 'bot' && !msg.isBot);
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.message}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input 
              type="text" 
              value={inputMsg} 
              onChange={e => setInputMsg(e.target.value)} 
              placeholder="Type your message..." 
              className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            <button type="submit" disabled={!inputMsg.trim()} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 md:px-0 md:py-0 md:max-w-none pb-24 md:pb-0 relative min-h-screen flex flex-col">
      {/* Header Banner */}
      <div className="relative mb-6 rounded-3xl bg-emerald-50 p-6 pt-8 border border-emerald-100">
        <button onClick={() => navigate(-1)} className="md:hidden absolute left-4 top-4 text-emerald-800 hover:bg-emerald-100 p-2 rounded-full transition">
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            <HeadphonesIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-headings font-extrabold text-emerald-950">How can we help?</h1>
            <p className="mt-1 text-xs font-medium text-emerald-700">Search our FAQ or chat with us.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8 px-1">
        <UserInput icon={<Search size={18} />} placeholder="Search help articles..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Contact Grid */}
      <div className="mb-10 px-1">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Get Support</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setActiveChat('admin')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition">
              <MessageCircle size={24} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-900">Admin Support</span>
              <span className="block text-[10px] font-semibold text-emerald-600 mt-1">Live Agents</span>
            </div>
          </button>
          
          <button onClick={() => setActiveChat('bot')} className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-purple-300 hover:shadow-md cursor-pointer group">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition">
              <Bot size={24} className="text-purple-600" />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-900">FlowBot AI</span>
              <span className="block text-[10px] font-semibold text-purple-600 mt-1">Instant Answers</span>
            </div>
          </button>
        </div>
      </div>

      {/* FAQs */}
      <div className="flex-grow px-1">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : faqs.map((faq: any, idx: number) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={faq.id || idx} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-gray-200">
                <button onClick={() => setExpandedFaq(isExpanded ? null : idx)} className="flex w-full items-center justify-between p-4 text-left cursor-pointer transition">
                  <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-500 flex-shrink-0 ml-4" /> : <ChevronDown size={18} className="text-gray-500 flex-shrink-0 ml-4" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
