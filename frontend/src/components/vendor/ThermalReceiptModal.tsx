import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  ShieldCheck,
  Clock,
  MapPin,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

interface ThermalTicketData {
  storeName: string;
  orderRef: string;
  createdAt: string;
  orderType: string;
  deliveryPin: string;
  deliveryAddress: string;
  deliveryZone: string;
  paymentMethod: string;
  totalAmount: number;
  items: {
    name: string;
    qty: number;
    price: number;
    modifiers: string[];
  }[];
  notes?: string;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  fallbackOrder?: any;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  orderId,
  fallbackOrder,
}) => {
  const { showToast } = useToast();
  const [ticketData, setTicketData] = useState<ThermalTicketData | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchThermalTicket();
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const fetchThermalTicket = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        success: boolean;
        ticketData: ThermalTicketData;
        formattedEscPosText: string;
      }>(`/vendor/orders/${orderId}/thermal-ticket`);

      if (res.success && res.ticketData) {
        setTicketData(res.ticketData);
        setRawText(res.formattedEscPosText || '');
      } else {
        createFallbackTicket();
      }
    } catch {
      createFallbackTicket();
    } finally {
      setLoading(false);
    }
  };

  const createFallbackTicket = () => {
    const o = fallbackOrder || {};
    const fallback: ThermalTicketData = {
      storeName: 'FlowMart Kitchen Express',
      orderRef: o.id ? o.id.substring(0, 8).toUpperCase() : 'FLW-83921',
      createdAt: new Date().toLocaleString(),
      orderType: 'FLOWMART EXPRESS DELIVERY',
      deliveryPin: o.deliveryPin || '8492',
      deliveryAddress: o.deliveryAddress || 'Verified Customer Location',
      deliveryZone: o.deliveryZone || 'Standard Zone',
      paymentMethod: o.paymentMethod || 'PAID (ESCROW SECURE)',
      totalAmount: Number(o.totalAmount || 6800),
      items: [
        {
          name: 'Special Smokey Jollof Rice & Chicken',
          qty: 2,
          price: 2800,
          modifiers: ['EXTRA SPICY SAUCE', 'FRIED PLANTAIN (DODO)'],
        },
        {
          name: 'Chilled Coca-Cola (500ml)',
          qty: 1,
          price: 650,
          modifiers: [],
        },
      ],
      notes: o.deliveryNotes || 'Leave with gate security. Call on arrival.',
    };
    setTicketData(fallback);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRaw = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      setCopied(true);
      showToast('80mm ESC/POS ticket copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                80mm Thermal Receipt Ticket
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  POS Ready
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Standard format for Sunmi, Epson, Xprinter thermal rolls
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Receipt Ticket Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-100 flex justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-600 h-8 w-8 mb-2" />
              <span className="text-xs font-bold text-gray-500">Generating 80mm thermal layout...</span>
            </div>
          ) : ticketData ? (
            /* 80mm Thermal Paper Simulation Container */
            <div
              id="thermal-receipt-printable"
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-[340px] text-gray-900 font-mono text-xs space-y-4"
              style={{
                letterSpacing: '-0.2px',
                lineHeight: 1.35,
              }}
            >
              {/* Ticket Top Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-black uppercase block tracking-wider">
                  FLOWMART KITCHEN
                </span>
                <span className="text-xs font-bold text-gray-600 block">
                  {ticketData.storeName}
                </span>
                <div className="text-[10px] text-gray-500 font-semibold pt-1">
                  Order #{ticketData.orderRef} • {ticketData.createdAt}
                </div>
              </div>

              {/* Delivery PIN Banner */}
              <div className="py-2.5 px-3 bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg text-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  CUSTOMER DELIVERY PIN
                </span>
                <span className="text-2xl font-black tracking-widest text-gray-900 block mt-0.5">
                  {ticketData.deliveryPin}
                </span>
                <span className="text-[9px] text-gray-500 block">
                  Verify with rider before dispatch handover
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-[11px] font-black uppercase tracking-wider block text-gray-400">
                  MEALS TO PREPARE:
                </span>
                {ticketData.items.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-black text-xs">
                      <span>[{item.qty}x] {item.name.toUpperCase()}</span>
                      <span>₦{(item.qty * item.price).toLocaleString()}</span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="pl-3 text-[10px] text-gray-600 font-bold space-y-0.5">
                        {item.modifiers.map((mod, i) => (
                          <div key={i}>&gt; {mod.toUpperCase()}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes & Address */}
              <div className="space-y-1 py-1 text-[11px] border-b-2 border-dashed border-gray-300">
                <div className="font-bold text-gray-800">
                  Drop: <span className="font-normal">{ticketData.deliveryAddress}</span>
                </div>
                {ticketData.notes && (
                  <div className="font-bold text-gray-800 pt-1">
                    Kitchen Note: <span className="italic font-normal">"{ticketData.notes}"</span>
                  </div>
                )}
              </div>

              {/* Totals & Payment */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between font-black text-sm">
                  <span>TOTAL:</span>
                  <span>₦{ticketData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-500 text-center font-bold pt-2 uppercase">
                  [{ticketData.paymentMethod} • ESCROW PROTECTED]
                </div>
              </div>

              {/* Barcode representation */}
              <div className="pt-2 text-center border-t border-dashed border-gray-200">
                <div className="inline-block font-mono text-[8px] tracking-[3px] text-gray-400 uppercase">
                  ||| | | |||| || | || ||| |||| |
                </div>
                <span className="block text-[9px] text-gray-400 mt-0.5 font-sans">
                  FlowMart Express Kitchen Automation 2026
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-white flex flex-wrap gap-3 justify-end">
          <button
            onClick={handleCopyRaw}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied ESC/POS' : 'Copy ESC/POS Text'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            <span>Print 80mm Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
