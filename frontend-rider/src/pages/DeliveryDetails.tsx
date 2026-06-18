import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  MoreVertical, 
  Clock, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Circle,
  Navigation,
  Navigation2,
  MessageSquare,
  User
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { RiderButton } from "@/components/ui/button";
import { useOrder } from "@/hooks/useRiderQueries";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { DeliveryChat } from "@/components/DeliveryChat";

// Custom marker icons
const riderIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-180' // Turn the default blue marker green (hacky but works without local assets)
});

const destIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to dynamically center map on rider
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function DeliveryDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: order } = useOrder(id || "");
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'map'>('map');
  
  // Real or mock GPS tracking
  const { location } = useLiveTracking(activeTab === 'map');
  
  // Fallback to a mock location in Lagos, Nigeria if GPS is unavailable
  const riderPos: [number, number] = location 
    ? [location.lat, location.lng] 
    : [6.4531, 3.3958]; // Lagos coords
    
  // Mock destination
  const destPos: [number, number] = [6.4322, 3.4219]; // Victoria Island

  const handleConfirmDelivery = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8 relative">
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col overflow-hidden relative">
        
        {/* Absolute Header Overlay (Map Mode) or Sticky Header (Details Mode) */}
        <div className={`flex items-center justify-between px-4 pt-6 pb-3 w-full z-20 transition-colors ${
          activeTab === 'map' ? 'absolute top-0 bg-gradient-to-b from-black/50 to-transparent text-white' : 'bg-white border-b border-border/30 text-foreground'
        }`}>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div className="flex bg-white/20 p-1 rounded-xl backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('map')} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${activeTab === 'map' ? 'bg-white text-emerald-800' : 'text-white'}`}
            >
              Live Map
            </button>
            <button 
              onClick={() => setActiveTab('details')} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${activeTab === 'details' ? 'bg-[#006837] text-white' : (activeTab === 'map' ? 'text-white' : 'text-muted-foreground')}`}
            >
              Details
            </button>
          </div>
          <button className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Dynamic Content View */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          
          {/* MAP VIEW */}
          {activeTab === 'map' && (
            <div className="flex-1 flex flex-col relative h-full">
              <div className="flex-1 relative">
                <MapContainer center={riderPos} zoom={14} className="w-full h-full z-0" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={riderPos} icon={riderIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  <Marker position={destPos} icon={destIcon}>
                    <Popup>Dropoff Location</Popup>
                  </Marker>
                  <MapUpdater center={riderPos} />
                </MapContainer>

                {/* Floating Map Actions */}
                <div className="absolute right-4 bottom-32 z-10 flex flex-col gap-3">
                  <button 
                    onClick={() => setShowChat(true)}
                    className="w-12 h-12 bg-[#006837] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#00522b] transition-transform active:scale-95"
                  >
                    <MessageSquare size={22} className="fill-current" />
                  </button>
                  <button className="w-12 h-12 bg-white text-emerald-800 rounded-full flex items-center justify-center shadow-lg border border-emerald-100">
                    <Navigation size={22} className="fill-current" />
                  </button>
                </div>
              </div>

              {/* Bottom Sheet Overlay on Map */}
              <div className="bg-white rounded-t-3xl shadow-[0_-4px_25px_rgba(0,0,0,0.1)] p-5 z-20 -mt-6">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{order?.customerName || "Customer"}</h2>
                    <p className="text-xs text-slate-500 font-medium">Dropoff • {order?.deliveryZone || "Pending Zone"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#006837]">{order?.distance || "0 km"}</p>
                    <p className="text-[10px] font-bold text-slate-400">~{order?.estimatedTime || "0 min"}</p>
                  </div>
                </div>

                <div className="flex gap-3 mb-2">
                  <RiderButton 
                    onClick={handleConfirmDelivery}
                    className="flex-1 bg-[#006837] hover:bg-[#00522b] text-white py-3.5 rounded-xl text-sm font-bold shadow-xs"
                  >
                    Slide to Arrive →
                  </RiderButton>
                </div>
              </div>
            </div>
          )}

          {/* DETAILS VIEW */}
          {activeTab === 'details' && (
            <div className="p-4 flex flex-col gap-4 pb-24">
              {/* Status Badges */}
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-800 text-white">
                  <Navigation2 size={12} className="fill-current rotate-90" />
                  {order?.status === 'picked_up' ? 'In Transit' : order?.status || 'Loading...'}
                </span>
              </div>

              {/* Recipient Information Card */}
              <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xs">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Recipient</span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <User size={22} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h2 className="text-sm font-bold text-foreground">{order?.customerName || "Customer"}</h2>
                    <span className="text-xs text-muted-foreground">Recipient</span>
                  </div>
                  <button onClick={() => setShowChat(true)} className="w-10 h-10 rounded-full bg-[#f0fdf4] text-[#15803d] flex items-center justify-center">
                    <MessageSquare size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-[#f0fdf4] text-[#15803d] flex items-center justify-center">
                    <Phone size={18} />
                  </button>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xs">
                <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Timeline</span>
                <div className="flex flex-col relative pl-6 mt-1">
                  <div className="absolute left-2 top-2 bottom-2 w-[1.5px] bg-emerald-700"></div>
                  
                  <div className="flex flex-col gap-0.5 pb-5 relative">
                    <CheckCircle2 size={16} className="absolute -left-6 top-0.5 text-emerald-700 bg-white fill-current" />
                    <h4 className="text-xs font-bold text-foreground">Order Assigned</h4>
                    <span className="text-[11px] text-muted-foreground">{order?.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 pb-5 relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border-2 border-white ring-1 ring-emerald-700"></div>
                    <h4 className="text-xs font-bold text-emerald-700">In Transit</h4>
                    <span className="text-[11px] text-muted-foreground">--:--</span>
                  </div>
                  <div className="flex flex-col gap-0.5 relative">
                    <Circle size={14} className="absolute -left-[23px] top-0.5 text-muted-foreground/40 bg-white fill-white" />
                    <h4 className="text-xs font-bold text-muted-foreground/60">Delivered</h4>
                    <span className="text-[11px] text-muted-foreground/40">Pending</span>
                  </div>
                </div>
              </div>

              {/* Bottom Form Actions */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => navigate(`/delivery/${id}/report`)}
                  className="w-full bg-white text-destructive border border-destructive/30 hover:bg-destructive/5 py-3.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Report Issue
                </button>
                <RiderButton
                  onClick={handleConfirmDelivery}
                  disabled={isConfirming}
                  className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3.5 rounded-xl text-sm font-bold shadow-xs"
                >
                  {isConfirming ? "Processing..." : "Confirm Delivery"}
                </RiderButton>
              </div>
            </div>
          )}

        </div>

        {/* Overlay Chat Drawer */}
        {showChat && (
          <div className="absolute inset-x-0 bottom-0 z-50">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowChat(false)}></div>
            <DeliveryChat recipientName={order?.customerName || "Customer"} onClose={() => setShowChat(false)} />
          </div>
        )}

      </div>
    </div>
  );
}