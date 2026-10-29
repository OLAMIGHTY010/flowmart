import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Navigation, 
  Home, 
  Briefcase, 
  Check, 
  X, 
  Search, 
  Plus, 
  Sparkles 
} from "lucide-react";

interface SavedAddress {
  id: string;
  tag: string;
  street: string;
  zone: string;
  icon: "home" | "office" | "other";
}

const DEFAULT_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: "addr-1",
    tag: "Home",
    street: "14 Admiralty Way, Lekki Phase 1",
    zone: "Lekki / Victoria Island",
    icon: "home",
  },
  {
    id: "addr-2",
    tag: "Office",
    street: "Plot 8, Karimu Kotun, Victoria Island",
    zone: "Victoria Island / Ikoyi",
    icon: "office",
  },
  {
    id: "addr-3",
    tag: "Studio",
    street: "24 Isaac John Street, Ikeja GRA",
    zone: "Ikeja / Mainland",
    icon: "other",
  },
];

interface DeliveryAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect?: (address: { street: string; zone: string }) => void;
}

export const DeliveryAddressModal: React.FC<DeliveryAddressModalProps> = ({
  isOpen,
  onClose,
  onAddressSelect,
}) => {
  const [activeId, setActiveId] = useState("addr-1");
  const [customInput, setCustomInput] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowmart_active_address");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) setActiveId(parsed.id);
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (addr: SavedAddress) => {
    setActiveId(addr.id);
    try {
      localStorage.setItem("flowmart_active_address", JSON.stringify(addr));
      window.dispatchEvent(new CustomEvent("flowmart:addressChanged", { detail: addr }));
    } catch {
      // ignore
    }
    if (onAddressSelect) onAddressSelect({ street: addr.street, zone: addr.zone });
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const autoAddr: SavedAddress = {
          id: `loc-${Date.now()}`,
          tag: "Current Location",
          street: "Detected GPS Location (Lekki, Lagos)",
          zone: "Lekki Phase 1",
          icon: "other",
        };
        handleSelect(autoAddr);
      },
      (err) => {
        setIsLocating(false);
        alert("Unable to retrieve location. Please select or search manually.");
      },
      { timeout: 8000 }
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      tag: "Custom Address",
      street: customInput.trim(),
      zone: "Lagos Central",
      icon: "other",
    };
    handleSelect(newAddr);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#ffffff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          position: "relative",
          animation: "scaleUp 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: "#eef2ff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Choose Delivery Location
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "2px 0 0 0" }}>
                See exact delivery fees and instant ETAs for your address
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search bar & GPS Action */}
        <div style={{ padding: "20px 24px 12px 24px" }}>
          {/* Geolocation Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 14,
              border: "1.5px solid #4f46e5",
              backgroundColor: "#eef2ff",
              color: "#4f46e5",
              fontSize: "0.875rem",
              fontWeight: 700,
              cursor: isLocating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
              transition: "all 0.15s ease",
            }}
          >
            <Navigation size={16} />
            <span>{isLocating ? "Detecting GPS Position..." : "Use Current GPS Location"}</span>
          </button>

          {/* Manual Address Input */}
          <form onSubmit={handleCustomSubmit} style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Search street, building, or area in Lagos..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: 14,
                border: "1.5px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "0.875rem",
                outline: "none",
                color: "#0f172a",
              }}
            />
            {customInput.trim() && (
              <button
                type="submit"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px 12px",
                  borderRadius: 8,
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Set
              </button>
            )}
          </form>
        </div>

        {/* Saved Addresses List */}
        <div style={{ padding: "0 24px 24px 24px" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", margin: "12px 0 8px 0" }}>
            Saved Addresses
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEFAULT_SAVED_ADDRESSES.map((addr) => {
              const isSelected = activeId === addr.id;
              const IconComponent = addr.icon === "home" ? Home : addr.icon === "office" ? Briefcase : MapPin;

              return (
                <div
                  key={addr.id}
                  onClick={() => handleSelect(addr)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: `1.5px solid ${isSelected ? "#4f46e5" : "#e2e8f0"}`,
                    backgroundColor: isSelected ? "#eef2ff" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#4f46e5" : "#f1f5f9",
                        color: isSelected ? "#ffffff" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                          {addr.tag}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: "0.688rem", fontWeight: 800, padding: "1px 6px", borderRadius: 9999, backgroundColor: "#ecfdf5", color: "#059669" }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "2px 0 0 0" }}>
                        {addr.street}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddressModal;
