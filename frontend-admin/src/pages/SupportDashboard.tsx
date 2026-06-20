import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import io, { Socket } from 'socket.io-client';
import { Send, CheckCircle2, AlertCircle, Clock, UserCircle, MessageSquare } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : "http://localhost:5000";

interface Ticket {
  id: string;
  userId: string;
  status: string;
  userFullName?: string;
  userEmail?: string;
  userRole?: string;
  updatedAt: string;
}

interface Message {
  id: string;
  ticketId: string;
  senderId: string | null;
  message: string;
  isBot: boolean;
  createdAt: string;
}

export default function SupportDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();

    const newSocket = io(SOCKET_URL, {
      query: { userId: user?.id }
    });

    setSocket(newSocket);

    newSocket.on('support:assigned', (data) => {
      if (data.agentId === user?.id) {
        fetchTickets(); // Refresh queue
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (activeTicket && socket) {
      // Join ticket room
      socket.emit('support:join', { ticketId: activeTicket.id });
      
      // Fetch history
      fetchMessages(activeTicket.id);

      const handleNewMessage = (msg: Message) => {
        if (msg.ticketId === activeTicket.id) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      };

      socket.on('support:message', handleNewMessage);

      return () => {
        socket.off('support:message', handleNewMessage);
      };
    }
  }, [activeTicket, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    try {
      const res: any = await apiClient.get('/support/agent/tickets');
      if (res.data?.success || res.success) {
        setTickets(res.data?.tickets || res.tickets);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const res: any = await apiClient.get(`/support/ticket/${ticketId}/messages`);
      if (res.data?.success || res.success) {
        setMessages(res.data?.messages || res.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeTicket || !socket) return;

    socket.emit('support:message', {
      ticketId: activeTicket.id,
      senderId: user?.id,
      message: inputMessage,
      isBot: false
    });

    setInputMessage('');
  };

  const resolveTicket = async () => {
    if (!activeTicket) return;
    try {
      await apiClient.post(`/support/agent/ticket/${activeTicket.id}/resolve`);
      setActiveTicket(null);
      fetchTickets();
    } catch (err) {
      console.error("Failed to resolve ticket", err);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 mt-4">
      
      {/* Sidebar: Queue */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-primary" />
            Active Queue
          </h2>
          <span className="bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{tickets.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <CheckCircle2 size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Inbox Zero!</p>
              <p className="text-xs mt-1">No active escalations.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className={`p-4 cursor-pointer transition-colors ${activeTicket?.id === ticket.id ? 'bg-green-50 border-l-4 border-l-brand-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-800 truncate pr-2">{ticket.userFullName || 'Anonymous User'}</h4>
                    <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded font-bold uppercase">{ticket.userRole}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">{ticket.userEmail}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock size={10} />
                    {new Date(ticket.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        {activeTicket ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <UserCircle size={24} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{activeTicket.userFullName || 'Anonymous User'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 capitalize">{activeTicket.userRole}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={resolveTicket}
                className="flex items-center gap-1 text-sm font-bold text-white bg-slate-800 px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
              >
                <CheckCircle2 size={16} /> Mark Resolved
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
              {messages.map((msg, idx) => {
                const isMine = msg.senderId === user?.id;
                const isBot = msg.isBot;

                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      isMine 
                        ? 'bg-brand-primary text-white rounded-tr-sm shadow-sm' 
                        : isBot 
                          ? 'bg-blue-50 border border-blue-100 text-slate-800 rounded-tl-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {isBot && <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase mb-1"><AlertCircle size={10}/> FlowMart Bot History</div>}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-green-100' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Type a message to the user..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-brand-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={18} /> Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
            <MessageSquare size={64} className="opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Select a Ticket</h3>
            <p className="text-sm mt-2 max-w-sm">Choose an escalated ticket from the queue on the left to begin helping the user.</p>
          </div>
        )}
      </div>

    </div>
  );
}
