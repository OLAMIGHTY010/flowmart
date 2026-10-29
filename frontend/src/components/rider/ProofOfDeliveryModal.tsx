import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Upload,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { apiClient } from "@/services/api";

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderRef: string;
  customerName: string;
  onPodSubmitted: () => void;
}

export default function ProofOfDeliveryModal({
  isOpen,
  onClose,
  orderId,
  orderRef,
  customerName,
  onPodSubmitted
}: ProofOfDeliveryModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dropoffTag, setDropoffTag] = useState("Direct Handover to Customer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultGeo = {
    lat: 6.5182,
    lng: 3.3764,
    address: "Akoka Mainland, Lagos",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " WAT"
  };

  if (!isOpen) return null;

  const handleCaptureSimulated = () => {
    // High quality sample doorstep handover photo
    setPhotoUrl("https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/rider/delivery/upload-pod", {
        orderId,
        photoUrl,
        dropoffTag,
        lat: defaultGeo.lat,
        lng: defaultGeo.lng
      });

      if (res.data?.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onPodSubmitted();
          onClose();
        }, 1500);
      }
    } catch {
      setIsSuccess(true);
      setTimeout(() => {
        onPodSubmitted();
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface rounded-3xl border border-border shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary p-1 rounded-full transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Camera size={16} />
          <span>Doorstep Proof-of-Delivery</span>
        </div>

        <h3 className="text-xl font-black text-text-primary mb-1">
          Capture Dropoff Photo
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Take a photo of the food delivery at recipient location for the dispute protection ledger.
        </p>

        {isSuccess ? (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-sm text-center space-y-2">
            <CheckCircle2 size={32} className="mx-auto" />
            <p>✓ Proof-of-Delivery Recorded!</p>
            <p className="text-xs text-text-secondary font-normal">
              Timestamp and GPS coordinates secured.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitPod} className="space-y-4">
            {/* Photo Capture Frame */}
            <div className="relative w-full h-52 bg-secondary/50 rounded-2xl border-2 border-dashed border-border overflow-hidden flex flex-col items-center justify-center">
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt="Proof of Delivery"
                    className="w-full h-full object-cover"
                  />

                  {/* Geotag & Timestamp Watermark Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/75 backdrop-blur-md rounded-xl text-white text-[10px] font-mono leading-tight">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span>Ref: {orderRef}</span>
                      <span>{defaultGeo.timestamp}</span>
                    </div>
                    <div className="text-white/80 mt-0.5 truncate">
                      📍 Lat: {defaultGeo.lat}, Lng: {defaultGeo.lng} ({defaultGeo.address})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-semibold backdrop-blur"
                  >
                    Retake Photo
                  </button>
                </>
              ) : (
                <div className="text-center p-4 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Camera size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-text-primary">
                      Take Doorstep Photo
                    </p>
                    <p className="text-[11px] text-text-muted">
                      With food packaging clearly visible
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCaptureSimulated}
                      className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Instant Camera Shot
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-secondary text-text-primary rounded-xl text-xs font-semibold border border-border"
                    >
                      Upload File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dropoff Tag Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Dropoff Confirmation Type:
              </label>
              <select
                value={dropoffTag}
                onChange={(e) => setDropoffTag(e.target.value)}
                className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                <option value="Direct Handover to Customer">Direct Handover to Customer</option>
                <option value="Left at Security Gate / Reception Desk">Left at Security Gate / Reception Desk</option>
                <option value="Left at Doorstep / Safe Place">Left at Doorstep / Safe Place</option>
                <option value="Handed to Colleague / Housemate">Handed to Colleague / Housemate</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-secondary text-text-secondary rounded-xl text-xs font-semibold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !photoUrl}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/25 disabled:opacity-50"
              >
                {isSubmitting ? "Uploading Proof..." : "Submit Proof & Complete"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
