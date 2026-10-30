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
  Home,
  Briefcase,
  Clock,
  Heart,
  Smile,
  FileText,
  ChevronRight,
  Package,
  DoorOpen,
  ShieldAlert,
  Wallet,
  Crown,
  Share2,
  Copy,
  Check,
  Calendar,
  Zap,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { apiClient } from "@/services/api";
import { FlowPassModal } from "@/components/loyalty/FlowPassModal";
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

interface SavedAddressProfile {
  street: string;
  unit?: string;
  postcode?: string;
  notes?: string;
  dropoff?: string;
}


const SCHEDULED_DELIVERY_SLOTS = [
  { id: "today-lunch", day: "Today", time: "1:00 PM - 1:30 PM", label: "Lunch Express Rush" },
  { id: "today-dinner", day: "Today", time: "5:30 PM - 6:00 PM", label: "Early Dinner" },
  { id: "today-latenight", day: "Today", time: "7:30 PM - 8:00 PM", label: "Evening Comfort" },
  { id: "tomorrow-breakfast", day: "Tomorrow", time: "8:30 AM - 9:00 AM", label: "Morning Kickoff" },
  { id: "tomorrow-lunch", day: "Tomorrow", time: "12:30 PM - 1:00 PM", label: "Office Lunch Rush" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Mode: Digital Postcode (Primary) vs Manual Map/GPS (Fallback)
  const [deliveryMode, setDeliveryMode] = useState<"postcode" | "manual">("postcode");
  const [deliveryTiming, setDeliveryTiming] = useState<"express" | "scheduled">("express");
  const [scheduledSlot, setScheduledSlot] = useState<string>("today-lunch");

  // Address Tag (Chowdeck feature: Home / Work / Other)
  const [addressTag, setAddressTag] = useState<"home" | "work" | "other">("home");

  // Postcode Integration State
  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<
    "idle" | "loading" | "suggestions" | "verified" | "not-found" | "unavailable"
  >("idle");
  const [postcodeSuggestions, setPostcodeSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [verifiedPostcode, setVerifiedPostcode] = useState<string | null>(null);

  // Address Specifics
  const [streetAddress, setStreetAddress] = useState("");
  const [unitApartment, setUnitApartment] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [postcodeSuggestion, setPostcodeSuggestion] = useState<string | null>(null);
  const [resolvedZone, setResolvedZone] = useState<string | null>(null);

  // Drop-off Preference (Chowdeck signature: Hand it to me / Door / Security)
  const [dropoffOption, setDropoffOption] = useState<"hand_to_me" | "leave_at_door" | "leave_with_security">(
    "hand_to_me"
  );

  // Delivery Notes & Quick Chips
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Rider Tipping (Chowdeck signature: 0, 200, 500, 1000, custom)
  const [tipPreset, setTipPreset] = useState<number | "custom">(500);
  const [customTip, setCustomTip] = useState<string>("");

  // Manual fallback state
  const [address, setAddress] = useState("");
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // General checkout state
  const [showPayForMeModal, setShowPayForMeModal] = useState(false);
  const [payForMeOrder, setPayForMeOrder] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isFlowPassModalOpen, setIsFlowPassModalOpen] = useState(false);
  const [isFlowPassActive, setIsFlowPassActive] = useState(() => {
    try {
      return localStorage.getItem("flowmart_flowpass_active") === "true";
    } catch {
      return false;
    }
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank_transfer" | "pay_on_delivery" | "wallet">(
    "wallet"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryDetails, setDeliveryDetails] = useState<any>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill user profile and load saved address for tag
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Load saved address from localStorage when tag changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem("flowmart_saved_addresses");
      if (raw) {
        const parsed: Record<string, SavedAddressProfile> = JSON.parse(raw);
        if (parsed[addressTag]) {
          const profile = parsed[addressTag];
          setStreetAddress(profile.street || "");
          setUnitApartment(profile.unit || "");
          if (profile.postcode) {
            setPostcodeQuery(profile.postcode);
            verifyPostcodeCode(profile.postcode);
          }
          if (profile.notes) setDeliveryNotes(profile.notes);
          if (profile.dropoff) setDropoffOption(profile.dropoff as any);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [addressTag]);

  // Close suggestions dropdown on click outside
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
          return;
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

  // Append quick delivery note
  const handleAddNotePreset = (preset: string) => {
    if (deliveryNotes.includes(preset)) return;
    setDeliveryNotes((prev) => (prev ? `${prev}, ${preset}` : preset));
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
          setDeliveryDetails(res.deliveryCalc);
          if (res.deliveryCalc.resolvedZone) {
            setResolvedZone(res.deliveryCalc.resolvedZone);
          }
        }
      } catch (err: any) {
        console.error("Failed to calculate delivery fee", err);
        setDeliveryFee(0);
        setDeliveryDetails(null);
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

  // Compute Tip Amount
  const tipAmount = tipPreset === "custom" ? (Number(customTip) || 0) : tipPreset;

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const effectiveDeliveryFee = isFlowPassActive ? 0 : deliveryFee;
  const totalAmount = subtotal + effectiveDeliveryFee + tipAmount;

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
      
      // Synthesize clean address text with unit/apartment details
      let formattedStreet = streetAddress.trim();
      if (unitApartment.trim()) {
        formattedStreet = `${unitApartment.trim()}, ${formattedStreet}`;
      }

      const finalAddressSnapshot = isPostcodeMode
        ? `${formattedStreet}, ${verifiedPostcode}`
        : address.trim();

      // Save address profile locally for next time
      try {
        const raw = localStorage.getItem("flowmart_saved_addresses");
        const existing: Record<string, SavedAddressProfile> = raw ? JSON.parse(raw) : {};
        existing[addressTag] = {
          street: streetAddress.trim(),
          unit: unitApartment.trim(),
          postcode: verifiedPostcode || undefined,
          notes: deliveryNotes.trim() || undefined,
          dropoff: dropoffOption,
        };
        localStorage.setItem("flowmart_saved_addresses", JSON.stringify(existing));
      } catch {
        // ignore
      }

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
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
        dropoffOption,
        deliveryNotes: deliveryNotes.trim() || undefined,
        addressTag,
        scheduledDeliverySlot: deliveryTiming === "scheduled"
          ? SCHEDULED_DELIVERY_SLOTS.find((s) => s.id === scheduledSlot)?.time
          : "Standard Express",
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

    const handlePayForMe = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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
      let formattedStreet = streetAddress.trim();
      if (unitApartment.trim()) {
        formattedStreet = `${unitApartment.trim()}, ${formattedStreet}`;
      }

      const finalAddressSnapshot = isPostcodeMode
        ? `${formattedStreet}, ${verifiedPostcode}`
        : address.trim();

      const payload = {
        items: cart.map((item) => ({
          productId: (item as any).originalProductId || item.id.substring(0, 36),
          quantity: item.qty,
        })),
        payment_method: "paystack",
        deliveryPostcode: isPostcodeMode ? verifiedPostcode : null,
        deliveryAddress: finalAddressSnapshot,
        zone: isPostcodeMode ? (resolvedZone || "Default") : address.trim(),
        phone: phone,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
        dropoffOption,
        deliveryNotes: deliveryNotes.trim() || undefined,
        addressTag,
      };

      const res: any = await apiClient.post("/orders", payload);
      const orderData = res?.order || res?.data?.order || { id: res?.id, orderRef: res?.orderRef };

      if (orderData?.id) {
        clearCart();
        setPayForMeOrder(orderData);
        setShowPayForMeModal(true);
      } else {
        showToast("Order initialized but missing reference. Redirecting to tracking...", "info");
        clearCart();
        navigate("/orders");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Error setting up Pay For Me. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    if (!payForMeOrder?.id) return;
    const shareUrl = `${window.location.origin}/pay-for-me/${payForMeOrder.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareViaWhatsApp = () => {
    if (!payForMeOrder?.id) return;
    const shareUrl = `${window.location.origin}/pay-for-me/${payForMeOrder.id}`;
    const message = encodeURIComponent(
      `Hey! I just placed an order on FlowMart (Ref: ${payForMeOrder.orderRef || payForMeOrder.id.slice(0, 8)}). Could you kindly sponsor/pay for it here? ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

return (
    <div className="container" style={{ padding: "32px 24px 100px 24px" }}>
      {/* Top Breadcrumb & Live Dispatch Pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link
          to="/cart"
          style={{
            color: "var(--color-primary)",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to Cart
        </Link>

        {/* Chowdeck-Style Express Dispatch Banner */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 9999,
            backgroundColor: "var(--color-primary-surface)",
            color: "var(--color-primary)",
            fontSize: "0.813rem",
            fontWeight: 700,
          }}
        >
          <Clock size={14} className="animate-pulse" />
          <span>⚡ FlowMart Express • Est. Delivery 25 - 40 Mins</span>
        </div>
      </div>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--color-text-primary)",
          marginBottom: 28,
          letterSpacing: "-0.02em",
        }}
      >
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gap: 32 }} className="checkout-grid">
        {/* Left: Interactive Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Card: Delivery Address & Profiles */}
          <div className="card" style={{ padding: 24, borderRadius: 16 }}>
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
                    width: 38,
                    height: 38,
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
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Delivery Address</h2>
                  <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                    Select saved location or verify national digital postcode
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
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    transition: "all var(--transition-fast, 0.2s)",
                    backgroundColor:
                      deliveryMode === "postcode" ? "var(--color-bg-primary, #ffffff)" : "transparent",
                    color:
                      deliveryMode === "postcode"
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
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
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    transition: "all var(--transition-fast, 0.2s)",
                    backgroundColor:
                      deliveryMode === "manual" ? "var(--color-bg-primary, #ffffff)" : "transparent",
                    color:
                      deliveryMode === "manual"
                        ? "var(--color-primary)"
                        : "var(--color-text-muted)",
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

            {/* Chowdeck Feature: Saved Address Profile Chips */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Deliver to
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { id: "home", label: "Home", icon: Home },
                  { id: "work", label: "Work", icon: Briefcase },
                  { id: "other", label: "Other", icon: MapPin },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = addressTag === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAddressTag(item.id as any)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 9999,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: `1.5px solid ${
                          isActive ? "var(--color-primary)" : "var(--color-border)"
                        }`,
                        backgroundColor: isActive
                          ? "var(--color-primary-surface)"
                          : "var(--color-bg-primary)",
                        color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Icon size={14} />
                      {item.label}
                      {isActive && <CheckCircle2 size={14} style={{ color: "var(--color-primary)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {/* Recipient Full Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
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
                <div>
                  <PhoneInput label="Phone Number" value={phone} onChange={setPhone} required />
                </div>
              </div>

              {/* -------------------- TAB 1: DIGITAL POSTCODE -------------------- */}
              {deliveryMode === "postcode" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
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
                          fontWeight: 700,
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
                            backgroundColor: "var(--color-primary-surface)",
                            color: "var(--color-primary)",
                            fontWeight: 700,
                          }}
                        >
                          OFFICIAL
                        </span>
                      </label>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        e.g. LA-11 or full AA-99-H77-BB-55
                      </span>
                    </div>

                    <div style={{ position: "relative", display: "flex", gap: 8 }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Type area (e.g. LA-11 or FC-01)..."
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
                            fontWeight: 700,
                            paddingRight: 40,
                            borderColor:
                              postcodeStatus === "verified"
                                ? "var(--color-primary)"
                                : postcodeStatus === "not-found"
                                ? "#dc2626"
                                : undefined,
                          }}
                        />

                        {/* Status Icon */}
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
                          padding: "0 22px",
                          height: "auto",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          borderRadius: "var(--radius-md, 8px)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Verify
                      </button>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestionsDropdown && postcodeSuggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          marginTop: 4,
                          backgroundColor: "var(--color-bg-primary)",
                          borderRadius: 12,
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                          border: "1px solid var(--color-border)",
                          maxHeight: 260,
                          overflowY: "auto",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                            borderBottom: "1px solid var(--color-border)",
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
                                  : "1px solid var(--color-border-light, #f3f4f6)",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-bg-secondary)";
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
                                  color: "var(--color-primary)",
                                }}
                              >
                                {item.code}
                              </span>
                              {item.description && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: "0.813rem",
                                    color: "var(--color-text-secondary)",
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
                                    backgroundColor: "var(--color-primary-surface)",
                                    color: "var(--color-primary)",
                                    fontWeight: 700,
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
                                    backgroundColor: "var(--color-bg-tertiary)",
                                    color: "var(--color-text-secondary)",
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
                        borderRadius: 10,
                        backgroundColor: "var(--color-primary-surface)",
                        border: "1px solid var(--color-primary-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CheckCircle2 size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--color-primary-hover)", fontSize: "0.875rem" }}>
                            Verified Postcode: {verifiedPostcode}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}>
                            Verified via NIPOST National Registry
                            {resolvedZone && ` • Delivery Zone: ${resolvedZone}`}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
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
                        borderRadius: 10,
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />
                        <div style={{ fontSize: "0.813rem", color: "#991b1b", fontWeight: 600 }}>
                          {postcodeError || "Postcode was not recognized in the national registry."}
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
                              color: "var(--color-primary)",
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

                  {/* Verification Banner: UNAVAILABLE */}
                  {postcodeStatus === "unavailable" && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
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
                          National postcode verification is unreachable right now.
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
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Use Manual Map
                      </button>
                    </div>
                  )}

                  {/* Street & Apartment Inputs (Chowdeck Experience) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Street Address & House / Plot Number *
                      </label>
                      <input
                        required
                        type="text"
                        className="input-field"
                        placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Apartment, Suite, Unit, or Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Flat 3B, Emerald Block, Gate 2"
                        value={unitApartment}
                        onChange={(e) => setUnitApartment(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------- TAB 2: MANUAL MAP ENTRY -------------------- */}
              {deliveryMode === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
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
                    rows={2}
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
                      height: 220,
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
                </div>
              )}

              {/* Chowdeck Feature: Drop-off Delivery Preference Cards */}
              <div style={{ marginTop: 8 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  Drop-Off Preference
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  {[
                    { id: "hand_to_me", label: "Hand it to me", desc: "Rider hands to you", icon: Package },
                    { id: "leave_at_door", label: "Leave at door/gate", desc: "Contactless drop", icon: DoorOpen },
                    { id: "leave_with_security", label: "Leave with security", desc: "Building concierge", icon: ShieldAlert },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = dropoffOption === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setDropoffOption(opt.id as any)}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1.5px solid ${
                            isSelected ? "var(--color-primary)" : "var(--color-border)"
                          }`,
                          backgroundColor: isSelected
                            ? "var(--color-primary-surface)"
                            : "var(--color-bg-primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? "var(--color-primary)"
                              : "var(--color-bg-tertiary)",
                            color: isSelected ? "#ffffff" : "var(--color-text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                            }}
                          >
                            {opt.label}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {opt.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chowdeck Feature: Courier Delivery Notes & Fast Presets */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Notes for Delivery Courier (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Call when outside the gate, beware of dog..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {[
                    "📞 Call on arrival",
                    "🤫 Do not ring doorbell",
                    "🛡️ Leave with gate security",
                    "🐕 Beware of dog",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddNotePreset(preset)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 9999,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: "var(--color-bg-tertiary)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          
          {/* Chowdeck Signature Feature: Delivery Timing & Scheduled Slots */}
          <div className="card" style={{ padding: 24, borderRadius: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
                    Delivery Timing
                  </h2>
                  <p
                    style={{
                      fontSize: "0.813rem",
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    Select immediate dispatch or lock a guaranteed delivery window
                  </p>
                </div>
              </div>

              {/* Toggle: Standard Express vs. Schedule */}
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
                  onClick={() => setDeliveryTiming("express")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: deliveryTiming === "express" ? "#ffffff" : "transparent",
                    color: deliveryTiming === "express" ? "var(--color-primary)" : "var(--color-text-muted)",
                    boxShadow: deliveryTiming === "express" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  ⚡ Standard Express (25-35m)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTiming("scheduled")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: deliveryTiming === "scheduled" ? "#ffffff" : "transparent",
                    color: deliveryTiming === "scheduled" ? "var(--color-primary)" : "var(--color-text-muted)",
                    boxShadow: deliveryTiming === "scheduled" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  🕒 Schedule Ahead
                </button>
              </div>
            </div>

            {deliveryTiming === "scheduled" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                {SCHEDULED_DELIVERY_SLOTS.map((slot) => {
                  const isSelected = scheduledSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setScheduledSlot(slot.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        border: `1.5px solid ${
                          isSelected ? "var(--color-primary)" : "var(--color-border)"
                        }`,
                        backgroundColor: isSelected
                          ? "var(--color-primary-surface)"
                          : "var(--color-bg-primary)",
                        color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            color: "var(--color-primary)",
                          }}
                        >
                          {slot.day}
                        </span>
                        <Calendar size={13} style={{ opacity: 0.7 }} />
                      </div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 800 }}>{slot.time}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {slot.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  backgroundColor: "var(--color-bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Zap size={16} style={{ color: "var(--color-primary)" }} />
                <span
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  Immediate dispatch active. Nearest courier will be alerted as soon as the merchant starts preparing your order.
                </span>
              </div>
            )}
          </div>

          {/* Chowdeck Signature Feature: Rider Tipping Card */}
          <div className="card" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart size={18} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Tip Your Delivery Rider</h2>
                <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                  100% of your tip goes directly to the courier delivering your order
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { val: 0, label: "No Tip" },
                { val: 200, label: "₦200" },
                { val: 500, label: "₦500", popular: true },
                { val: 1000, label: "₦1,000" },
              ].map((item) => {
                const isSelected = tipPreset === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setTipPreset(item.val);
                      setCustomTip("");
                    }}
                    style={{
                      flex: "1 1 80px",
                      padding: "12px 14px",
                      borderRadius: 12,
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1.5px solid ${
                        isSelected ? "var(--color-primary)" : "var(--color-border)"
                      }`,
                      backgroundColor: isSelected
                        ? "var(--color-primary-surface)"
                        : "var(--color-bg-primary)",
                      color: isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
                      position: "relative",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item.popular && (
                      <span
                        style={{
                          position: "absolute",
                          top: -8,
                          right: 8,
                          fontSize: "0.625rem",
                          backgroundColor: "var(--color-primary)",
                          color: "#ffffff",
                          padding: "2px 6px",
                          borderRadius: 9999,
                          fontWeight: 800,
                        }}
                      >
                        POPULAR
                      </span>
                    )}
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setTipPreset("custom")}
                style={{
                  flex: "1 1 80px",
                  padding: "12px 14px",
                  borderRadius: 12,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${
                    tipPreset === "custom" ? "var(--color-primary)" : "var(--color-border)"
                  }`,
                  backgroundColor:
                    tipPreset === "custom"
                      ? "var(--color-primary-surface)"
                      : "var(--color-bg-primary)",
                  color:
                    tipPreset === "custom" ? "var(--color-primary)" : "var(--color-text-primary)",
                }}
              >
                Custom
              </button>
            </div>

            {tipPreset === "custom" && (
              <div style={{ marginTop: 12, maxWidth: 200 }}>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter tip (₦)..."
                  className="input-field"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Section: Payment Method Selection */}
          <div className="card" style={{ padding: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={18} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Payment Method</h2>
                <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                  Choose your preferred payment channel
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  id: "wallet",
                  label: "FlowMart In-App Wallet",
                  desc: walletBalance !== null
                    ? (walletBalance >= totalAmount
                        ? `₦${walletBalance.toLocaleString()} Available • 1-Click Instant Checkout`
                        : `₦${walletBalance.toLocaleString()} Available • Insufficient balance (Need ₦${(totalAmount - walletBalance).toLocaleString()} more)`)
                    : "1-Click instant payment from your wallet balance",
                  badge: walletBalance !== null && walletBalance >= totalAmount ? "1-Click Instant" : null,
                },
                { id: "card", label: "Credit/Debit Card (Paystack)", desc: "Instant & Secure via Paystack" },
                { id: "bank_transfer", label: "Direct Bank Transfer", desc: "Transfer directly to verified FlowMart account" },
                {
                  id: "pay_on_delivery",
                  label: "Pay on Delivery",
                  desc: "Pay via POS or Cash when package arrives",
                },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      border: `1.5px solid ${
                        isSelected ? "var(--color-primary)" : "var(--color-border)"
                      }`,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? "var(--color-primary-surface)"
                        : "var(--color-bg-primary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={isSelected}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      style={{ accentColor: "var(--color-primary)", width: 18, height: 18 }}
                    />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>{method.label}</div>
                        {method.badge && (
                          <span
                            style={{
                              fontSize: "0.688rem",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              backgroundColor: "#ecfdf5",
                              color: "#059669",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                        {method.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar (Desktop) */}
        <div>
          <div
            className="card"
            style={{
              padding: 24,
              borderRadius: 16,
              position: "sticky",
              top: 88,
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 20 }}>Order Summary</h2>

            {/* Items mini list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    <strong style={{ color: "var(--color-primary)", marginRight: 6 }}>{item.qty}x</strong>
                    {item.name}
                  </span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>
                    ₦{(Number(item.price) * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 16 }} />

            {/* Financial Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.938rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>Items Subtotal</span>
                <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              {isFlowPassActive ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.938rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#6d28d9", fontWeight: 700 }}>
                    <Crown size={15} style={{ color: "#fbbf24" }} />
                    FlowPass Free Delivery
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ textDecoration: "line-through", color: "var(--color-text-muted)", fontSize: "0.813rem" }}>
                      ₦{deliveryFee.toLocaleString()}
                    </span>
                    <span style={{ fontWeight: 800, color: "#10b981" }}>FREE</span>
                  </span>
                </div>
              ) : (
                <>
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
                    <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                      ₦{deliveryFee.toLocaleString()}
                    </span>
                  </div>

                  {/* Chowdeck-Grade Surge & Rain Breakdown */}
                  {deliveryDetails?.isSurgeActive && (
                    <div style={{ marginTop: 4, marginBottom: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {deliveryDetails.surgeFee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.813rem", color: "#b45309" }}>
                          <span>⚡ High Demand Surge ({deliveryDetails.surgeMultiplier}x):</span>
                          <span style={{ fontWeight: 600 }}>+₦{deliveryDetails.surgeFee.toLocaleString()}</span>
                        </div>
                      )}
                      {deliveryDetails.weatherFee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.813rem", color: "#2563eb" }}>
                          <span>🌧️ Rain Delivery Safety Bonus:</span>
                          <span style={{ fontWeight: 600 }}>+₦{deliveryDetails.weatherFee.toLocaleString()}</span>
                        </div>
                      )}
                      {deliveryDetails.weatherFee > 0 && (
                        <div style={{ padding: "6px 10px", borderRadius: 8, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.75rem", color: "#1e40af", display: "flex", alignItems: "flex-start", gap: 6, marginTop: 2 }}>
                          <span>🌧️</span>
                          <span><strong>Rain Mode:</strong> 100% of this fee goes directly to your courier champion for safe transit.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {deliveryFee > 0 && (
                    <div
                      onClick={() => setIsFlowPassModalOpen(true)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%)",
                        border: "1px dashed var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Crown size={13} style={{ color: "var(--color-primary)" }} />
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)" }}>
                          Save ₦{deliveryFee.toLocaleString()} with FlowPass
                        </span>
                      </div>
                      <span style={{ fontSize: "0.688rem", fontWeight: 800, color: "var(--color-primary)" }}>
                        Unlock Free Delivery →
                      </span>
                    </div>
                  )}
                </>
              )}

              {resolvedZone && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                  }}
                >
                  ✓ Pricing Zone: {resolvedZone}
                </div>
              )}

              {tipAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.938rem",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                  }}
                >
                  <span>Courier Tip ❤️</span>
                  <span>+₦{tipAmount.toLocaleString()}</span>
                </div>
              )}

              {deliveryError && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-destructive, #ef4444)" }}>
                  ⚠️ {deliveryError}
                </div>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: "var(--color-border)", marginBottom: 20 }} />

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>Total to Pay</span>
              <span
                style={{
                  fontSize: "1.625rem",
                  fontWeight: 800,
                  color: "var(--color-primary)",
                }}
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
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 12,
                opacity: isSubmitting || !!deliveryError || !isAddressComplete ? 0.6 : 1,
                cursor:
                  isSubmitting || !!deliveryError || !isAddressComplete
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ShieldCheck size={20} />
              {isSubmitting
                ? "Processing Order..."
                : paymentMethod === "wallet"
                ? `Pay with Wallet • ₦${totalAmount.toLocaleString()}`
                : `Place Order • ₦${totalAmount.toLocaleString()}`}
            </button>

            <div style={{ margin: "14px 0 10px 0", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
                <span style={{ fontSize: "0.688rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>OR VIRAL SOCIAL CHECKOUT</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
              </div>

              <button
                type="button"
                onClick={handlePayForMe}
                disabled={isSubmitting || !!deliveryError || !isAddressComplete}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  borderRadius: 12,
                  border: "1.5px solid var(--color-primary)",
                  backgroundColor: "var(--color-primary-surface, #eef2ff)",
                  color: "var(--color-primary)",
                  cursor: isSubmitting || !!deliveryError || !isAddressComplete ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={16} />
                Pay For Me (Ask Someone to Pay)
              </button>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: "var(--color-bg-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShieldCheck size={16} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                FlowMart Escrow Protection Guarantee
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Chowdeck Mobile Floating Bottom Dock */}
      <div className="mobile-checkout-dock">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Total to Pay</span>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>
            ₦{totalAmount.toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isSubmitting || !!deliveryError || !isAddressComplete}
          className="btn-primary"
          style={{
            padding: "12px 24px",
            fontSize: "0.938rem",
            fontWeight: 700,
            borderRadius: 10,
            opacity: isSubmitting || !!deliveryError || !isAddressComplete ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "Placing..." : "Place Order"}
        </button>
      </div>

      {/* FlowPass VIP Membership Modal */}
      <FlowPassModal
        isOpen={isFlowPassModalOpen}
        onClose={() => setIsFlowPassModalOpen(false)}
        onSubscribed={() => setIsFlowPassActive(true)}
      />

      {/* Chowdeck-Grade "Pay For Me" Social Checkout Modal */}
      {showPayForMeModal && payForMeOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 500,
              width: "100%",
              borderRadius: 24,
              padding: 28,
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "fadeInUp 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: "var(--color-primary-surface, #eef2ff)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Pay For Me Link Created!</h3>
                  <p style={{ fontSize: "0.813rem", color: "var(--color-text-muted)" }}>
                    Ref: #{payForMeOrder.orderRef || payForMeOrder.id?.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPayForMeModal(false);
                  navigate(`/orders/${payForMeOrder.id}/track`);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
              Your order is safely reserved! Share the link below with a friend, partner, or sponsor. Once they settle the bill via Card or Bank Transfer, your kitchen begins preparing your order immediately.
            </p>

            {/* Share URL Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 12,
                backgroundColor: "var(--color-bg-secondary, #f8fafc)",
                border: "1px solid var(--color-border)",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: "0.813rem",
                  fontFamily: "monospace",
                  color: "var(--color-text-secondary)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {`${window.location.origin}/pay-for-me/${payForMeOrder.id}`}
              </span>
              <button
                type="button"
                onClick={copyShareLink}
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                {copiedLink ? <Check size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                onClick={shareViaWhatsApp}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: 12,
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  fontSize: "0.938rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.2)",
                }}
              >
                <Share2 size={18} />
                Share on WhatsApp
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPayForMeModal(false);
                  navigate(`/orders/${payForMeOrder.id}/track`);
                }}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 12,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Watch Order Status Live
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .checkout-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .checkout-grid { grid-template-columns: 2fr 1fr; }
        }

        .mobile-checkout-dock {
          display: none;
        }

        @media (max-width: 1023px) {
          .mobile-checkout-dock {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background-color: var(--color-bg-primary);
            border-top: 1px solid var(--color-border);
            padding: 14px 20px;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
