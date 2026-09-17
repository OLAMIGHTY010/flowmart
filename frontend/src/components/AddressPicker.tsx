/**
 * AddressPicker – FlowMart Address Selection Component
 *
 * Dependencies (install before using):
 *   npm install react-leaflet leaflet
 *   npm install -D @types/leaflet
 *
 * You must also import Leaflet's CSS in your app entry point (main.tsx or App.tsx):
 *   import 'leaflet/dist/leaflet.css';
 *
 * Uses OpenStreetMap tiles (free, no API key needed).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Home,
  Briefcase,
  Tag,
  Save,
  Search,
  Loader2,
  X,
  LocateFixed,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Fix Leaflet's default icon paths (broken by most bundlers)
// ---------------------------------------------------------------------------
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SavedAddress {
  label: string; // 'Home' | 'Work' | 'Other'
  address: string;
  landmark: string;
  latitude: number;
  longitude: number;
}

export interface AddressPickerProps {
  onAddressSaved: (address: SavedAddress) => void;
  initialAddress?: SavedAddress;
}

// Default center: Lagos, Nigeria
const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const DEFAULT_ZOOM = 15;

// Label options with icons & colors
const LABEL_OPTIONS = [
  { value: "Home", icon: Home, color: "emerald" },
  { value: "Work", icon: Briefcase, color: "blue" },
  { value: "Other", icon: Tag, color: "amber" },
] as const;

// ---------------------------------------------------------------------------
// Sub-components for Leaflet interaction
// ---------------------------------------------------------------------------

/** Recenter the map when position changes externally (GPS, search) */
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, map.getZoom(), { duration: 1 });
  }, [position, map]);
  return null;
}

/** Allow clicking on the map to drop/move pin */
function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Draggable marker */
function DraggableMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          onPositionChange(lat, lng);
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const AddressPicker: React.FC<AddressPickerProps> = ({
  onAddressSaved,
  initialAddress,
}) => {
  // State
  const [position, setPosition] = useState<[number, number]>(
    initialAddress
      ? [initialAddress.latitude, initialAddress.longitude]
      : LAGOS_CENTER
  );
  const [address, setAddress] = useState(initialAddress?.address ?? "");
  const [landmark, setLandmark] = useState(initialAddress?.landmark ?? "");
  const [label, setLabel] = useState(initialAddress?.label ?? "Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -----------------------------------------------------------------------
  // Reverse geocode whenever position changes
  // -----------------------------------------------------------------------
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      // Silently fail – user can type manually
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  const handlePositionChange = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // -----------------------------------------------------------------------
  // GPS / "Use My Location"
  // -----------------------------------------------------------------------
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handlePositionChange(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        alert("Unable to retrieve your location. Please allow location access.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handlePositionChange]);

  // -----------------------------------------------------------------------
  // Search (Nominatim)
  // -----------------------------------------------------------------------
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (query.trim().length < 3) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              query
            )}&format=json&limit=5&countrycodes=ng&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          setSearchResults(data ?? []);
          setShowSearchDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    []
  );

  const handleSearchResultClick = useCallback(
    (result: any) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      setPosition([lat, lng]);
      setAddress(result.display_name);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchDropdown(false);
    },
    []
  );

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  const handleSave = useCallback(() => {
    if (!address.trim()) {
      alert("Please select or enter an address.");
      return;
    }
    setIsSaving(true);
    const saved: SavedAddress = {
      label,
      address: address.trim(),
      landmark: landmark.trim(),
      latitude: position[0],
      longitude: position[1],
    };

    // Brief delay for UX feedback
    setTimeout(() => {
      onAddressSaved(saved);
      setIsSaving(false);
    }, 400);
  }, [address, label, landmark, position, onAddressSaved]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4 flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg leading-tight">
            Delivery Address
          </h2>
          <p className="text-emerald-100 text-xs mt-0.5">
            Tap the map or search to set your location
          </p>
        </div>
      </div>

      {/* ================================================================
          SEARCH BAR + GPS BUTTON
          ================================================================ */}
      <div className="px-4 pt-4 pb-2 flex gap-2" ref={searchContainerRef}>
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for an address in Nigeria…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
              transition-all placeholder:text-gray-400"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Loading spinner inside input */}
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
          )}

          {/* Dropdown results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <ul className="absolute z-[1000] mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-56 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors flex items-start gap-2.5 border-b border-gray-50 last:border-b-0"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 line-clamp-2">
                      {result.display_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl
            bg-emerald-50 text-emerald-700 text-sm font-medium
            hover:bg-emerald-100 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isLocating ? "Locating…" : "Use GPS"}
          </span>
        </button>
      </div>

      {/* ================================================================
          MAP (≈60% height)
          ================================================================ */}
      <div className="px-4 pb-3">
        <div className="relative w-full h-[320px] sm:h-[360px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <MapContainer
            center={position}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            className="w-full h-full z-0"
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker
              position={position}
              onPositionChange={handlePositionChange}
            />
            <MapClickHandler onPositionChange={handlePositionChange} />
            <RecenterMap position={position} />
          </MapContainer>

          {/* Floating coordinate badge */}
          <div className="absolute bottom-2 left-2 z-[500] bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2.5 py-1 rounded-lg">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
        </div>
      </div>

      {/* ================================================================
          FORM FIELDS
          ================================================================ */}
      <div className="px-4 pb-5 space-y-4">
        {/* Address Field */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Address
            {isReverseGeocoding && (
              <Loader2 className="w-3 h-3 text-emerald-500 animate-spin ml-1" />
            )}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your delivery address will appear here…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
              transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Landmark Description */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            Landmark Description
            <span className="text-xs text-gray-400 font-normal ml-1">
              (helps riders find you)
            </span>
          </label>
          <textarea
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder='e.g. "Behind Shoprite, beside the yellow gate, 2-storey building with blue roof"'
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
              transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Label Selector */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Save As
          </label>
          <div className="flex gap-2">
            {LABEL_OPTIONS.map(({ value, icon: Icon, color }) => {
              const isActive = label === value;
              const colorMap: Record<string, { active: string; inactive: string }> = {
                emerald: {
                  active:
                    "bg-emerald-100 text-emerald-700 border-emerald-300 ring-2 ring-emerald-400/30",
                  inactive:
                    "bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50",
                },
                blue: {
                  active:
                    "bg-primary/20 text-primary border-primary ring-2 ring-primary/80/30",
                  inactive:
                    "bg-white text-gray-500 border-gray-200 hover:border-primary/30 hover:bg-primary/10",
                },
                amber: {
                  active:
                    "bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-400/30",
                  inactive:
                    "bg-white text-gray-500 border-gray-200 hover:border-amber-200 hover:bg-amber-50",
                },
              };
              const styles = colorMap[color];

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLabel(value)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                    rounded-xl border text-sm font-medium
                    transition-all duration-200 active:scale-95
                    ${isActive ? styles.active : styles.inactive}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !address.trim()}
          className="w-full flex items-center justify-center gap-2
            bg-gradient-to-r from-emerald-600 to-emerald-500
            hover:from-emerald-700 hover:to-emerald-600
            text-white font-semibold text-sm
            py-3.5 rounded-xl
            shadow-lg shadow-emerald-500/25
            active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? "Saving…" : "Save Address"}
        </button>
      </div>
    </div>
  );
};

export default AddressPicker;
