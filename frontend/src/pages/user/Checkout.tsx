import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition, setAddress, setIsManualInput }: any) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  useMapEvents({
    async click(e) {
      if (setIsManualInput) setIsManualInput(false);
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setAddress("Fetching location details...");

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (err) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    },
  });

  return position ? <Marker position={position as [number, number]} /> : null;
};

interface SuggestionItem {
  code: string;
  state?: string;
  lga?: string;
  description?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Mode: Digital Postcode (Primary) vs Manual Map/GPS (Fallback)
  const [deliveryMode, setDeliveryMode] = useState<"postcode" | "manual">("postcode");

  // Postcode Integration State
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<
    "idle" | "loading" | "suggestions" | "verified" | "not-found" | "unavailable"
  >("idle");
  const [postcodeSuggestions, setPostcodeSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [verifiedPostcode, setVerifiedPostcode] = useState<string | null>(null);
  const [streetAddress, setStreetAddress] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [postcodeSuggestion, setPostcodeSuggestion] = useState<string | null>(null);
  const [resolvedZone, setResolvedZone] = useState<string | null>(null);

  // Manual fallback state
  const [address, setAddress] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // General checkout state
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer" | "pay_on_delivery">(
    "card"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill user profile
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Postcode Autocomplete Effect with 300ms debounce and AbortController
  useEffect(() => {
    if (deliveryMode !== "postcode") return;

    const trimmed = postcodeQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setPostcodeSuggestions([]);
      setShowSuggestionsDropdown(false);
      if (postcodeStatus !== "verified") {
        setPostcodeStatus("idle");
      }
      return;
    }

    // If query matches current verified postcode, do not re-search
    if (verifiedPostcode && trimmed === verifiedPostcode) {
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setPostcodeStatus("loading");
        const res = await apiClient.get<{
          success: boolean;
          data: { suggestions: SuggestionItem[] };
        }>(
          `/postcode/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { signal: abortController.signal }
        );

        if (res.data?.suggestions && res.data.suggestions.length > 0) {
          setPostcodeSuggestions(res.data.suggestions);
          setShowSuggestionsDropdown(true);
          setPostcodeStatus("suggestions");
        } else {
          setPostcodeSuggestions([]);
          setShowSuggestionsDropdown(false);
          setPostcodeStatus("idle");
        }
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          return; // Ignore aborted requests
        }
        if (err?.response?.status === 503) {
          setPostcodeStatus("unavailable");
          setPostcodeError("National Postcode service is temporarily offline. You can use standard map entry.");
        } else {
          setPostcodeStatus("idle");
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [postcodeQuery, deliveryMode, verifiedPostcode]);

  // Execute Level 1 Verification
  const verifyPostcodeCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim();
    if (!clean) return;

    setPostcodeStatus("loading");
    setPostcodeError(null);
    setPostcodeSuggestion(null);
    setShowSuggestionsDropdown(false);

    try {
      const res = await apiClient.get<{
        success: boolean;
        data: { postcode: string; valid: boolean; source?: string };
      }>(`/postcode/verify?code=${encodeURIComponent(clean)}`);

      if (res.data?.valid) {
        setVerifiedPostcode(res.data.postcode);
        setPostcodeQuery(res.data.postcode);
        setPostcodeStatus("verified");
        showToast(`Postcode ${res.data.postcode} verified successfully!`, "success");
      } else {
        setVerifiedPostcode(null);
        setPostcodeStatus("not-found");
        setPostcodeError("The entered postcode is not recognized in Nigeria's national registry.");
      }
    } catch (err: any) {
      setVerifiedPostcode(null);
      const data = err.response?.data;
      if (err.response?.status === 400 && data?.errors?.[0]?.message) {
        const msg = data.errors[0].message;
        setPostcodeError(msg);
        setPostcodeStatus("not-found");
        // Look for 'Did you mean "..."?'
        const match = msg.match(/Did you mean \"([^\"]+)\"/);
        if (match && match[1]) {
          setPostcodeSuggestion(match[1]);
        }
      } else if (err.response?.status === 404) {
        setPostcodeStatus("not-found");
        setPostcodeError(data?.message || "Postcode not found in national registry.");
        if (data?.suggestion) {
          setPostcodeSuggestion(data.suggestion);
        }
      } else if (err.response?.status === 503 || err.response?.status >= 500) {
        setPostcodeStatus("unavailable");
        setPostcodeError("National Postcode registry is temporarily unreachable. Silently falling back to manual entry.");
      } else {
        setPostcodeStatus("not-found");
        setPostcodeError(data?.message || "Postcode verification failed. Please check the code or use map entry.");
      }
    }
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setPostcodeQuery(item.code);
    setShowSuggestionsDropdown(false);
    verifyPostcodeCode(item.code);
  };

  const handleApplySuggestion = (sugg: string) => {
    setPostcodeQuery(sugg);
    setPostcodeSuggestion(null);
    verifyPostcodeCode(sugg);
  };

  const handleClearPostcode = () => {
    setPostcodeQuery("");
    setVerifiedPostcode(null);
    setPostcodeStatus("idle");
    setPostcodeError(null);
    setPostcodeSuggestion(null);
    setPostcodeSuggestions([]);
    setShowSuggestionsDropdown(false);
  };

  // Manual Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    setIsManualInput(false);
    setIsLoadingLocation(true);
    setAddress("Fetching your current location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapPosition([lat, lng]);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (err) {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }

        setIsLoadingLocation(false);
        showToast("Location captured successfully", "success");
      },
      () => {
        setIsLoadingLocation(false);
        showToast("Unable to retrieve your location", "error");
        setAddress("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Address Geocoding Effect (for manual typing)
  useEffect(() => {
    if (deliveryMode !== "manual" || !isManualInput || !address || address.trim().length < 5)
      return;

    const geocodeAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapPosition([lat, lon]);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      geocodeAddress();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [address, isManualInput, deliveryMode]);

  // Delivery Fee Calculation Effect
  useEffect(() => {
    const isPostcodeActive = deliveryMode === "postcode" && !!verifiedPostcode;
    const isManualActive = deliveryMode === "manual" && !!address.trim();

    if (!isPostcodeActive && !isManualActive) {
      setDeliveryFee(0);
      setResolvedZone(null);
      return;
    }

    const fetchDeliveryFee = async () => {
      setIsCalculatingDelivery(true);
      setDeliveryError(null);
      try {
        const payload: any = { distanceKm: 5 };
        if (isPostcodeActive) {
          payload.postcode = verifiedPostcode;
        } else {
          payload.zone = address;
        }

        const res = await apiClient.post<{ success: boolean; deliveryCalc?: any }>(
          "/orders/calculate-delivery",
          payload
        );

        if (res.deliveryCalc && res.deliveryCalc.finalDeliveryFee !== undefined) {
          setDeliveryFee(res.deliveryCalc.finalDeliveryFee);
          if (res.deliveryCalc.resolvedZone) {
            setResolvedZone(res.deliveryCalc.resolvedZone);
          }
        }
      } catch (err: any) {
        console.error("Failed to calculate delivery fee", err);
        setDeliveryFee(0);
        setResolvedZone(null);
        setDeliveryError(
          err.response?.data?.message || "Delivery pricing is not configured for this zone."
        );
      } finally {
        setIsCalculatingDelivery(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDeliveryFee();
    }, 600);

    return () => clearTimeout(timer);
  }, [deliveryMode, verifiedPostcode, address]);

  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const totalAmount = subtotal + deliveryFee;

  const isAddressComplete =
    deliveryMode === "postcode"
      ? !!verifiedPostcode && !!streetAddress.trim()
      : !!address.trim();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      return showToast("Your cart is empty", "error");
    }
    if (deliveryError) {
      return showToast("Cannot place order: " + deliveryError, "error");
    }
    if (!isAddressComplete) {
      return showToast(
        deliveryMode === "postcode"
          ? "Please verify your postcode and enter your street address"
          : "Please enter your delivery address",
        "error"
      );
    }

    setIsSubmitting(true);
    try {
      const isPostcodeMode = deliveryMode === "postcode" && !!verifiedPostcode;
      const finalAddressSnapshot = isPostcodeMode
        ? `${streetAddress.trim()}, ${verifiedPostcode}`
        : address.trim();

      const payload = {
        items: cart.map((item) => ({
          productId: (item as any).originalProductId || item.id.substring(0, 36),
          quantity: item.qty,
        })),
        payment_method: paymentMethod === "card" ? "paystack" : paymentMethod,
        deliveryPostcode: isPostcodeMode ? verifiedPostcode : null,
        deliveryAddress: finalAddressSnapshot,
        zone: isPostcodeMode ? (resolvedZone || "Default") : address.trim(),
        phone: phone,
      };

      const res = await apiClient.post<{ success: boolean; paymentUrl?: string }>(
        "/orders",
        payload
      );

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        showToast("Order placed successfully!", "success");
        clearCart();
        navigate(`/orders/${(res as any).order?.id}/track`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Error placing order. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "32px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Link to="/cart" style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          ← Back to Cart
        </Link>
      </div>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: 32,
        }}
      >
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gap: 32 }} className="checkout-grid">
        {/* Left: Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Section: Delivery Address */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Delivery Details</h2>
                  <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                    Verify your destination using Nigeria's National Digital Postcode
                  </p>
                </div>
              </div>

              {/* Delivery Mode Toggle Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
                  padding: 4,
                  borderRadius: "var(--radius-lg, 8px)",
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setDeliveryMode("postcode")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md, 6px)",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    transition: "all var(--transition-fast, 0.2s)",
                    backgroundColor:
                      deliveryMode === "postcode" ? "var(--color-bg-primary, #ffffff)" : "transparent",
                    color:
                      deliveryMode === "postcode"
                        ? "var(--color-primary, #15803d)"
                        : "var(--color-text-muted, #6b7280)",
                    boxShadow:
                      deliveryMode === "postcode" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} />
                  Digital Postcode (NIPOST)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode("manual")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md, 6px)",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    transition: "all var(--transition-fast, 0.2s)",
                    backgroundColor:
                      deliveryMode === "manual" ? "var(--color-bg-primary, #ffffff)" : "transparent",
                    color:
                      deliveryMode === "manual"
                        ? "var(--color-primary, #15803d)"
                        : "var(--color-text-muted, #6b7280)",
                    boxShadow:
                      deliveryMode === "manual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Navigation size={14} />
                  Pin on Map / Manual
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {/* Recipient Full Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginBottom: 6,
                  }}
                >
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={fullName}
                  readOnly
                  style={{ backgroundColor: "var(--color-bg-secondary)", opacity: 0.85 }}
                />
              </div>

              {/* Recipient Phone */}
              <div>
                <PhoneInput label="Phone Number" value={phone} onChange={setPhone} required />
              </div>

              {/* -------------------- TAB 1: DIGITAL POSTCODE -------------------- */}
              {deliveryMode === "postcode" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    padding: 16,
                    borderRadius: "var(--radius-lg, 12px)",
                    backgroundColor: "var(--color-bg-secondary, #fafafa)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                  }}
                >
                  {/* Postcode Input Field */}
                  <div style={{ position: "relative" }} ref={dropdownRef}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <label
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        Nigeria Digital Postcode
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: "rgba(21, 128, 61, 0.1)",
                            color: "var(--color-primary, #15803d)",
                            fontWeight: 700,
                          }}
                        >
                          OFFICIAL
                        </span>
                      </label>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Format: AA-99-H77-BB-55 or area (e.g. LA-11)
                      </span>
                    </div>

                    <div style={{ position: "relative", display: "flex", gap: 8 }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Type postcode or area (e.g. LA-11 or FC-01)..."
                          value={postcodeQuery}
                          onChange={(e) => {
                            setPostcodeQuery(e.target.value.toUpperCase());
                            setPostcodeError(null);
                            setPostcodeSuggestion(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              verifyPostcodeCode(postcodeQuery);
                            }
                          }}
                          style={{
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            fontWeight: 600,
                            paddingRight: 40,
                            borderColor:
                              postcodeStatus === "verified"
                                ? "#16a34a"
                                : postcodeStatus === "not-found"
                                ? "#dc2626"
                                : undefined,
                          }}
                        />

                        {/* Clear or Status Icon */}
                        <div
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {postcodeStatus === "loading" ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                              style={{ color: "var(--color-primary)" }}
                            />
                          ) : postcodeQuery ? (
                            <button
                              type="button"
                              onClick={handleClearPostcode}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                color: "var(--color-text-muted)",
                              }}
                            >
                              <X size={16} />
                            </button>
                          ) : (
                            <Search size={16} style={{ color: "var(--color-text-muted)" }} />
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => verifyPostcodeCode(postcodeQuery)}
                        disabled={postcodeStatus === "loading" || !postcodeQuery.trim()}
                        className="btn-primary"
                        style={{
                          padding: "0 20px",
                          height: "auto",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          borderRadius: "var(--radius-md, 8px)",
                          whiteSpace: "nowrap",
                          cursor:
                            postcodeStatus === "loading" || !postcodeQuery.trim()
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            postcodeStatus === "loading" || !postcodeQuery.trim() ? 0.6 : 1,
                        }}
                      >
                        Verify
                      </button>
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestionsDropdown && postcodeSuggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          marginTop: 4,
                          backgroundColor: "var(--color-bg-primary, #ffffff)",
                          borderRadius: "var(--radius-lg, 8px)",
                          boxShadow:
                            "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                          border: "1px solid var(--color-border, #e5e7eb)",
                          maxHeight: 260,
                          overflowY: "auto",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-muted)",
                            borderBottom: "1px solid var(--color-border, #e5e7eb)",
                          }}
                        >
                          Matching National Postcodes:
                        </div>
                        {postcodeSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom:
                                idx === postcodeSuggestions.length - 1
                                  ? "none"
                                  : "1px solid #f3f4f6",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: "0.938rem",
                                  color: "var(--color-primary, #15803d)",
                                }}
                              >
                                {item.code}
                              </span>
                              {item.description && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: "0.813rem",
                                    color: "var(--color-text-secondary, #4b5563)",
                                  }}
                                >
                                  {item.description}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              {item.state && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    backgroundColor: "#e0e7ff",
                                    color: "#3730a3",
                                    fontWeight: 600,
                                  }}
                                >
                                  {item.state}
                                </span>
                              )}
                              {item.lga && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    backgroundColor: "#f3f4f6",
                                    color: "#374151",
                                  }}
                                >
                                  {item.lga}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Verification Banner: SUCCESS */}
                  {postcodeStatus === "verified" && verifiedPostcode && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md, 8px)",
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CheckCircle2 size={20} style={{ color: "#059669", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.875rem" }}>
                            Verified Postcode: {verifiedPostcode}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#047857" }}>
                            Verified via NIPOST National Registry
                            {resolvedZone && ` • Delivery Zone: ${resolvedZone}`}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#d1fae5",
                          color: "#065f46",
                          fontWeight: 700,
                          padding: "4px 10px",
                          borderRadius: 9999,
                        }}
                      >
                        VALID LEVEL 1
                      </span>
                    </div>
                  )}

                  {/* Verification Banner: NOT FOUND / INVALID */}
                  {postcodeStatus === "not-found" && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md, 8px)",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
                        <div style={{ fontSize: "0.813rem", color: "#991b1b", fontWeight: 500 }}>
                          {postcodeError || "Postcode was not recognized in the national database."}
                        </div>
                      </div>
                      {postcodeSuggestion && (
                        <div style={{ marginLeft: 28, fontSize: "0.813rem", color: "#7f1d1d" }}>
                          Did you mean:{" "}
                          <button
                            type="button"
                            onClick={() => handleApplySuggestion(postcodeSuggestion)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-primary, #15803d)",
                              fontWeight: 700,
                              textDecoration: "underline",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            {postcodeSuggestion}
                          </button>
                          ? (Click to apply)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Banner: SERVICE UNAVAILABLE FALLBACK */}
                  {postcodeStatus === "unavailable" && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md, 8px)",
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AlertCircle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                        <div style={{ fontSize: "0.813rem", color: "#92400e" }}>
                          National postcode verification is currently unreachable.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeliveryMode("manual")}
                        style={{
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          backgroundColor: "#d97706",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Use Manual Map
                      </button>
                    </div>
                  )}

                  {/* Street & House Details (Required for Courier delivery) */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        marginBottom: 6,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      Street Address, Building, or Apartment Details *
                    </label>
                    <textarea
                      required
                      className="input-field"
                      rows={2}
                      placeholder="e.g. Flat 3B, Plot 12, Admiralty Way, Lekki Phase 1..."
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                    />
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                      Your verified postcode anchors delivery pricing and district routing; your street
                      details guide the courier directly to your door.
                    </p>
                  </div>
                </div>
              )}

              {/* -------------------- TAB 2: MANUAL MAP / GPS ENTRY -------------------- */}
              {deliveryMode === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Street Address / Manual Location
                    </label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLoadingLocation}
                      className="btn-secondary"
                      style={{
                        fontSize: "0.75rem",
                        padding: "6px 12px",
                        height: "auto",
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <Navigation size={12} />
                      {isLoadingLocation ? "Locating..." : "Use GPS Location"}
                    </button>
                  </div>

                  <textarea
                    required
                    className="input-field"
                    rows={3}
                    placeholder="Type your address to locate it on the map (e.g. 123 Main Street, Lagos)..."
                    value={address}
                    onChange={(e) => {
                      setIsManualInput(true);
                      setAddress(e.target.value);
                    }}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      height: 240,
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <MapContainer
                      center={mapPosition || [9.082, 8.6753]}
                      zoom={mapPosition ? 15 : 6}
                      style={{ width: "100%", height: "100%", zIndex: 0 }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker
                        position={mapPosition}
                        setPosition={setMapPosition}
                        setAddress={setAddress}
                        setIsManualInput={setIsManualInput}
                      />
                    </MapContainer>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Click anywhere on the map to pin your location, or type it manually.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Payment Method */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Payment Method</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { id: "card", label: "Credit/Debit Card", desc: "Pay securely via Paystack" },
                { id: "bank_transfer", label: "Bank Transfer", desc: "Direct transfer to our bank account" },
                {
                  id: "pay_on_delivery",
                  label: "Pay on Delivery",
                  desc: "Pay via POS or cash when your order arrives",
                },
              ].map((method) => (
                <div key={method.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      padding: 16,
                      border: `1.5px solid ${
                        paymentMethod === method.id ? "var(--color-primary)" : "var(--color-border)"
                      }`,
                      borderRadius: "var(--radius-lg)",
                      backgroundColor:
                        paymentMethod === method.id
                          ? "var(--color-primary-surface)"
                          : "var(--color-bg-primary)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      style={{ marginTop: 4, accentColor: "var(--color-primary)" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1rem" }}>{method.label}</div>
                      <div style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                        {method.desc}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div>
          <div className="card" style={{ padding: 24, position: "sticky", top: 88 }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 20 }}>Order Summary</h2>

            {/* Items mini list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {item.qty}x {item.name}
                  </span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    ₦{(Number(item.price) * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.938rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.938rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>
                  Delivery Fee{" "}
                  {isCalculatingDelivery && (
                    <span className="text-primary text-xs ml-2">(calculating...)</span>
                  )}
                </span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  ₦{deliveryFee.toLocaleString()}
                </span>
              </div>
              {resolvedZone && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-primary, #15803d)" }}>
                  ✓ Zone: {resolvedZone}
                </div>
              )}
              {deliveryError && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-destructive, #ef4444)" }}>
                  ⚠️ {deliveryError}
                </div>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>Total to Pay</span>
              <span
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}
              >
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !!deliveryError || !isAddressComplete}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "16px 24px",
                opacity: isSubmitting || !!deliveryError || !isAddressComplete ? 0.6 : 1,
                cursor:
                  isSubmitting || !!deliveryError || !isAddressComplete
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              <ShieldCheck size={20} />
              {isSubmitting ? "Processing..." : "Place Order securely"}
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginTop: 12,
              }}
            >
              Your personal data will be used to process your order, support your experience
              throughout this website, and for other purposes described in our privacy policy.
            </p>
          </div>
        </div>
      </form>

      <style>{`
        .checkout-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .checkout-grid { grid-template-columns: 2fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
