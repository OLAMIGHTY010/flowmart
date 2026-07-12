import { useState, useEffect } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
}

export function useLiveTracking(enabled: boolean = true) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!enabled || !("geolocation" in navigator)) {
      if (!("geolocation" in navigator)) {
        setError("Geolocation is not supported by your browser");
      }
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [enabled]);

  return { location, error, isTracking };
}
