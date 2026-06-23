import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : "https://flowmart-backend-2s2d-o0ljo79px-gbotemiojos-projects.vercel.app";

interface Message {
  id: string;
  senderId: string | null;
  message: string;
  isBot: boolean;
  createdAt: string;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && user && !ticketId) {
      initChat();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (ticketId && user) {
      const newSocket = io(SOCKET_URL, { query: { userId: user.id } });
      setSocket(newSocket);

      newSocket.emit('support:join', { ticketId });

      const handleNewMessage = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      };

      newSocket.on('support:message', handleNewMessage);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [ticketId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initChat = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; ticket: { id: string } }>('/support/ticket');
      if (res.success) {
        setTicketId(res.ticket.id);
        fetchHistory(res.ticket.id);
      }
    } catch (err) {
      console.error("Failed to init chat", err);
    }
  };

  const fetchHistory = async (id: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; messages: Message[] }>(`/support/ticket/${id}/messages`);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error("Failed to fetch chat history", err);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !ticketId || !socket) return;

    socket.emit('support:message', {
      ticketId,
      senderId: user?.id,
      message: inputMessage,
      isBot: false
    });

    setInputMessage('');
  };

  if (!user) return null; // Only show for logged in users

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed left-6 md:left-auto md:right-6 bottom-24 md:bottom-6 z-50 w-14 h-14 bg-brand-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed left-6 md:left-auto md:right-6 bottom-24 md:bottom-6 z-50 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5"
        >
          
          {/* Header */}
          <div className="bg-brand-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">FlowMart Support</h3>
                <p className="text-[10px] text-green-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1 rounded transition">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <span className="animate-pulse">Connecting...</span>
              </div>
            )}
            {messages.map((msg, idx) => {
              const isMine = msg.senderId === user.id;
              const isBot = msg.isBot;
              const isAgent = !isMine && !isBot;

              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMine 
                      ? 'bg-brand-primary text-white rounded-tr-sm shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {(!isMine && isAgent) && (
                      <p className="text-[10px] font-bold text-brand-primary mb-1 flex items-center gap-1 uppercase">
                        <User size={10} /> Support Agent
                      </p>
                    )}
                    {(!isMine && isBot) && (
                      <p className="text-[10px] font-bold text-blue-600 mb-1 flex items-center gap-1 uppercase">
                        <Bot size={10} /> AI Assistant
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-green-100' : 'text-slate-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim() || !ticketId}
                className="bg-brand-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
            <p className="text-[9px] text-center text-slate-400 mt-2">
              Type <strong className="text-brand-primary cursor-pointer hover:underline" onClick={() => setInputMessage("Talk to agent")}>talk to agent</strong> for human support.
            </p>
          </div>

        </div>
      )}
    </>
  );
}
