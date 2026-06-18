import React, { useState, useEffect, createContext, useContext } from 'react';
import { Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationContextType {
  simulateNewOrder: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function usePushNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within PushNotificationManager');
  }
  return context;
}

export function PushNotificationManager({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();

  // Expose a method to simulate incoming WebSocket push events
  const simulateNewOrder = () => {
    setNotification("FLW-20250621-0055");
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setNotification(null);
    }, 8000);
  };

  const handleViewRequest = () => {
    setNotification(null);
    navigate('/delivery/new');
  };

  return (
    <NotificationContext.Provider value={{ simulateNewOrder }}>
      {children}
      
      {/* Toast Overlay */}
      {notification && (
        <div className="fixed top-4 left-0 right-0 z-50 px-4 flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-full max-w-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Package size={20} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">New Delivery Assignment</h3>
                  <p className="text-xs text-slate-500 font-medium">Priority Order: {notification}</p>
                </div>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <button
              onClick={handleViewRequest}
              className="w-full py-2.5 bg-[#006837] text-white text-sm font-bold rounded-xl shadow-xs hover:bg-[#00522b] transition-colors"
            >
              View Request
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
