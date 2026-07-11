import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to dynamically fly to location on map
function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

interface LocationData {
  country: string;
  state: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

interface LocationSelectorProps {
  initialData?: Partial<LocationData>;
  onChange: (data: LocationData) => void;
}

export function LocationSelector({ initialData, onChange }: LocationSelectorProps) {
  const [countries, setCountries] = useState(Country.getAllCountries());
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  
  const [location, setLocation] = useState<LocationData>({
    country: initialData?.country || '',
    state: initialData?.state || '',
    city: initialData?.city || '',
    lat: initialData?.lat || null,
    lng: initialData?.lng || null
  });

  // Init from initialData if provided
  useEffect(() => {
    if (initialData?.country) {
      const country = countries.find(c => c.name === initialData.country);
      if (country) {
        setSelectedCountryCode(country.isoCode);
        setStates(State.getStatesOfCountry(country.isoCode));
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCountryCode && initialData?.state) {
      const state = State.getStatesOfCountry(selectedCountryCode).find(s => s.name === initialData.state);
      if (state) {
        setSelectedStateCode(state.isoCode);
        setCities(City.getCitiesOfState(selectedCountryCode, state.isoCode));
      }
    }
  }, [selectedCountryCode]);

  const handleCountryChange = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    if (!country) return;
    
    setSelectedCountryCode(country.isoCode);
    setStates(State.getStatesOfCountry(country.isoCode));
    setCities([]);
    setSelectedStateCode('');
    
    const newLoc = {
      country: country.name,
      state: '',
      city: '',
      lat: parseFloat(country.latitude),
      lng: parseFloat(country.longitude)
    };
    setLocation(newLoc);
    onChange(newLoc);
  };

  const handleStateChange = (stateName: string) => {
    const state = states.find(s => s.name === stateName);
    if (!state) return;
    
    setSelectedStateCode(state.isoCode);
    setCities(City.getCitiesOfState(selectedCountryCode, state.isoCode));
    
    const newLoc = {
      ...location,
      state: state.name,
      city: '',
      lat: state.latitude ? parseFloat(state.latitude) : location.lat,
      lng: state.longitude ? parseFloat(state.longitude) : location.lng
    };
    setLocation(newLoc);
    onChange(newLoc);
  };

  const handleCityChange = (cityName: string) => {
    const city = cities.find(c => c.name === cityName);
    if (!city) return;
    
    const newLoc = {
      ...location,
      city: city.name,
      lat: city.latitude ? parseFloat(city.latitude) : location.lat,
      lng: city.longitude ? parseFloat(city.longitude) : location.lng
    };
    setLocation(newLoc);
    onChange(newLoc);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Country</label>
          <Select value={location.country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px]">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {countries.map(c => (
                <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">State / Region</label>
          <Select value={location.state} onValueChange={handleStateChange} disabled={!selectedCountryCode}>
            <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px]">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {states.map(s => (
                <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">City</label>
          <Select value={location.city} onValueChange={handleCityChange} disabled={!selectedStateCode || cities.length === 0}>
            <SelectTrigger className="w-full bg-input border-border rounded-xl px-3.5 h-[46px]">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {cities.map(c => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Map Verification */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">Location Verification Map</label>
        <p className="text-xs text-muted-foreground mb-1">Visually confirm your selected location below.</p>
        <div className="h-[250px] w-full rounded-xl overflow-hidden border border-border shadow-sm z-0 relative">
          {location.lat && location.lng ? (
            <MapContainer 
              center={[location.lat, location.lng]} 
              zoom={13} 
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={[location.lat, location.lng]} />
              <MapUpdater lat={location.lat} lng={location.lng} />
            </MapContainer>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              Select a country to view map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
