import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, MoreVertical, ChevronDown } from 'lucide-react';

interface DeliveryChatProps {
  recipientName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'rider' | 'customer';
  timestamp: string;
}

export function DeliveryChat({ recipientName, onClose }: DeliveryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'rider',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-100 animate-in slide-in-from-bottom-1/2 duration-300 z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronDown size={20} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{recipientName}</h3>
            <p className="text-[10px] text-[#15803d] font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
            <Phone size={16} />
          </button>
          <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="text-center text-[10px] font-medium text-slate-400 mb-2 font-body">
          Today
        </div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender === 'rider' ? 'self-end items-end' : 'self-start items-start'}`}>
            <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium ${
              msg.sender === 'rider' 
                ? 'bg-[#15803d] text-white rounded-tr-sm' 
                : 'bg-slate-100 text-slate-800 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-medium px-1">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 bg-white pb-safe">
        <div className="flex items-center gap-2 bg-slate-50 rounded-full p-1.5 pr-2 border border-slate-200">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..." 
            className="flex-1 bg-transparent px-3 text-sm outline-none text-slate-800 placeholder:text-slate-400 font-body"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              input.trim() ? 'bg-[#006837] text-white shadow-sm' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
