import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, Plus, Loader2, ArrowLeft, Tag } from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  isOffer: boolean;
  offerAmount: number;
  offerStatus: "pending" | "accepted" | "rejected" | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  productId: string;
  vendorId: string;
  buyerId: string;
  productName: string;
  productImage: string;
  isBuyer: boolean;
  otherUser?: {
    id: string;
    fullName: string;
    avatar: string;
  };
  updatedAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [inputText, setInputText] = useState("");
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for conversations and active chat messages
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const interval = setInterval(() => fetchMessages(activeChat.id), 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; conversations: Conversation[] }>("/chat/conversations");
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await apiClient.get<{ success: boolean; messages: ChatMessage[] }>(`/chat/conversations/${id}/messages`);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || (!inputText && !isOfferMode)) return;

    if (isOfferMode && !offerAmount) return;

    try {
      setSending(true);
      const payload = isOfferMode
        ? { isOffer: true, offerAmount: parseFloat(offerAmount) }
        : { content: inputText, isOffer: false };

      const res = await apiClient.post(`/chat/conversations/${activeChat.id}/messages`, payload);
      
      if (res.success) {
        setMessages((prev) => [...prev, res.message]);
        setInputText("");
        setOfferAmount("");
        setIsOfferMode(false);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleRespondToOffer = async (messageId: string, action: "accept" | "reject") => {
    try {
      const res = await apiClient.post(`/chat/messages/${messageId}/accept-offer`, { action });
      if (res.success) {
        // Update local state
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: action === "accept" ? "accepted" : "rejected" } : m));
      }
    } catch (err) {
      console.error("Failed to respond to offer", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden font-body">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-extrabold text-xl text-gray-900">Messages</h2>
          <Link to="/" className="text-sm font-semibold text-orange-500 hover:underline md:hidden">Back to Shop</Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <MessageCircle size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-semibold">No messages yet.</p>
              <p className="text-xs mt-1">When you chat with a seller, it will appear here.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveChat(conv);
                  setMessages([]);
                }}
                className={`w-full text-left p-4 border-b border-gray-100 flex items-center gap-3 transition-colors hover:bg-orange-50 ${activeChat?.id === conv.id ? 'bg-orange-50' : 'bg-white'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={conv.productImage || "https://placehold.co/100x100"} alt="product" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{conv.productName}</h4>
                  <p className="text-xs text-gray-500 truncate">{conv.isBuyer ? 'Seller' : 'Buyer'}: {conv.otherUser?.fullName}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <MessageCircle size={60} className="mb-4 text-gray-200" />
            <p className="font-bold text-gray-500">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center gap-3 shadow-sm z-10">
              <button 
                className="md:hidden p-2 -ml-2 text-gray-500 hover:text-orange-500 transition-colors"
                onClick={() => setActiveChat(null)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                <img src={activeChat.productImage || "https://placehold.co/100x100"} alt="Product" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{activeChat.productName}</h3>
                <p className="text-xs font-semibold text-gray-500">
                  Chat with <span className="text-orange-600">{activeChat.otherUser?.fullName}</span>
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#f8fafc]">
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                
                if (msg.isOffer) {
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-sm border ${
                        isMe ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag size={16} className={isMe ? 'text-orange-500' : 'text-gray-500'} />
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {isMe ? 'You made an offer' : 'Offer received'}
                          </span>
                        </div>
                        <p className="text-2xl font-headings font-extrabold text-gray-900 mb-3">
                          ₦{Number(msg.offerAmount).toLocaleString()}
                        </p>
                        
                        {/* Offer Actions / Status */}
                        {msg.offerStatus === 'pending' ? (
                          !isMe && !activeChat.isBuyer ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleRespondToOffer(msg.id, 'accept')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">Accept</button>
                              <button onClick={() => handleRespondToOffer(msg.id, 'reject')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold py-2 rounded-lg transition-colors">Reject</button>
                            </div>
                          ) : (
                            <div className="text-center bg-orange-100 text-orange-700 text-xs font-bold py-1.5 rounded-lg border border-orange-200">
                              Pending Review
                            </div>
                          )
                        ) : msg.offerStatus === 'accepted' ? (
                          <div className="text-center bg-green-100 text-green-800 text-xs font-bold py-1.5 rounded-lg border border-green-200">
                            Offer Accepted
                          </div>
                        ) : (
                          <div className="text-center bg-red-100 text-red-800 text-xs font-bold py-1.5 rounded-lg border border-red-200">
                            Offer Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                      isMe ? 'bg-orange-500 text-white font-medium rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
              {isOfferMode ? (
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₦</span>
                    <input
                      type="number"
                      placeholder="Enter offer amount..."
                      className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-gray-900 outline-none focus:border-orange-500 focus:bg-white transition-colors"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOfferMode(false)}
                    className="p-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !offerAmount}
                    className="h-11 px-4 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 transition-colors disabled:opacity-50 font-bold text-sm shadow-md"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : "Send Offer"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center bg-gray-100 rounded-2xl border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-colors overflow-hidden">
                    <input
                      type="text"
                      placeholder="Write a message..."
                      className="flex-1 bg-transparent py-3 px-4 text-sm outline-none text-gray-900"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {activeChat.isBuyer && (
                      <button
                        type="button"
                        onClick={() => setIsOfferMode(true)}
                        className="flex-1 sm:flex-none px-4 bg-amber-100 text-amber-700 font-bold text-sm rounded-xl flex items-center justify-center gap-1 hover:bg-amber-200 transition-colors border border-amber-200 shadow-sm whitespace-nowrap"
                      >
                        <Tag size={16} /> Make Offer
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={sending || !inputText.trim()}
                      className="h-11 w-11 sm:w-12 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-md flex-shrink-0"
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
