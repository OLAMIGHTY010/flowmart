import { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';

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
  const countries = Country.getAllCountries();
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
          <select 
            value={location.country} 
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full bg-input border border-border rounded-xl px-3.5 h-[46px] outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select Country</option>
            {countries.map(c => (
              <option key={c.isoCode} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">State / Region</label>
          <select 
            value={location.state} 
            onChange={(e) => handleStateChange(e.target.value)} 
            disabled={!selectedCountryCode}
            className="w-full bg-input border border-border rounded-xl px-3.5 h-[46px] outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">Select State</option>
            {states.map(s => (
              <option key={s.isoCode} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">City</label>
          <select 
            value={location.city} 
            onChange={(e) => handleCityChange(e.target.value)} 
            disabled={!selectedStateCode || cities.length === 0}
            className="w-full bg-input border border-border rounded-xl px-3.5 h-[46px] outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">Select City</option>
            {cities.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
}
