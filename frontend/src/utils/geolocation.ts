/**
 * FlowMart Geolocation & Reverse Geocoding Utility
 * Provides multi-tier real-time GPS coordinate capture and street/zone resolution.
 */

export interface GeocodedAddress {
  street: string;
  zone: string;
  city: string;
  state?: string;
  country?: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion {
  displayName: string;
  street: string;
  zone: string;
  latitude: number;
  longitude: number;
}

/**
 * Capture user's exact device GPS coordinates with timeout and accuracy fallbacks.
 */
export const getUserCoordinates = (timeoutMs = 12000): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser or device."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Fallback retry with lower accuracy if high accuracy timed out
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(new Error(getGeolocationErrorMessage(err))),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        } else {
          reject(new Error(getGeolocationErrorMessage(error)));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 }
    );
  });
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access was denied. Please allow location access in your browser settings.";
    case error.POSITION_UNAVAILABLE:
      return "GPS signal is currently unavailable. Please check your connection or choose address manually.";
    case error.TIMEOUT:
      return "Location detection timed out. Please try again or search manually.";
    default:
      return "Unable to determine your location.";
  }
}

/**
 * Reverse geocodes latitude/longitude into a real-world Nigerian/global street address.
 * Uses a resilient dual-tier strategy: Nominatim (detailed road/suburb) + BigDataCloud (CORS-friendly locality fallback).
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodedAddress> => {
  let nomData: any = null;
  let bdcData: any = null;

  // 1. Query Nominatim with custom user-agent & 5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" },
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      nomData = await res.json();
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Query BigDataCloud (completely open CORS, highly reliable on mobile browsers)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      bdcData = await res.json();
    }
  } catch (err) {
    // Continue
  }

  let street = "";
  let zone = "";
  let city = "";
  let state = "";
  let country = "Nigeria";

  if (nomData?.address) {
    const a = nomData.address;
    const road = a.road || a.pedestrian || a.street || a.highway || a.building;
    const neighborhood = a.suburb || a.neighbourhood || a.residential || a.quarter || a.hamlet;
    const district = a.city_district || a.county || a.suburb;

    city = a.city || a.town || a.municipality || a.village || "Lagos";
    state = a.state || city;
    country = a.country || "Nigeria";

    const streetParts = [road, neighborhood].filter(Boolean);
    street = streetParts.length > 0 ? streetParts.join(", ") : (nomData.name || "");

    const zoneParts = [neighborhood || district, city].filter(Boolean);
    zone = zoneParts.length > 0 ? zoneParts.join(", ") : state;
  }

  if ((!street || !zone) && bdcData) {
    const bdcStreet = [bdcData.locality, bdcData.city].filter(Boolean).join(", ");
    if (!street) street = bdcStreet || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    city = city || bdcData.city || bdcData.locality || "Lagos";
    state = state || bdcData.principalSubdivision || "Lagos";
    country = country || bdcData.countryName || "Nigeria";

    if (!zone) zone = [bdcData.locality || bdcData.city, state].filter(Boolean).join(", ");
  }

  // Final fallback to formatted coordinates if both APIs were blocked
  if (!street) {
    street = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    zone = "Detected Area";
  }

  const fullAddress = nomData?.display_name || `${street}, ${zone}, ${country}`;

  return {
    street,
    zone,
    city,
    state,
    country,
    fullAddress,
    latitude: lat,
    longitude: lng,
  };
};

/**
 * Search location autocomplete suggestions for manual address entry.
 */
export const searchLocationSuggestions = async (
  query: string,
  countryCode = "ng"
): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5&countrycodes=${countryCode}&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept-Language": "en" },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const a = item.address || {};
      const road = a.road || a.pedestrian || a.suburb || item.name;
      const zone = [a.suburb || a.city_district || a.county, a.city || a.state].filter(Boolean).join(", ");

      return {
        displayName: item.display_name,
        street: road ? `${road}, ${a.suburb || a.city || ""}`.replace(/,\s*$/, "") : item.display_name.split(",")[0],
        zone: zone || "Lagos",
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
};
