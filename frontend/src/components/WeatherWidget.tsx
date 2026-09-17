import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Loader, CloudLightning, CloudDrizzle, CloudSnow, Wind } from 'lucide-react';
import { api } from '../services/api';

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Default to Lagos if geolocation isn't ready
        let queryParams = '?city=Lagos';

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              queryParams = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
              const response = await api.get(`/weather${queryParams}`);
              if (response.data.success) {
                setWeather(response.data.data);
              }
              setLoading(false);
            },
            async () => {
              // Fallback if permission denied
              const response = await api.get(`/weather${queryParams}`);
              if (response.data.success) {
                setWeather(response.data.data);
              }
              setLoading(false);
            }
          );
        } else {
          const response = await api.get(`/weather${queryParams}`);
          if (response.data.success) {
            setWeather(response.data.data);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case 'rain': return <CloudRain className="h-6 w-6 text-primary" />;
      case 'clouds': return <Cloud className="h-6 w-6 text-gray-400" />;
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'thunderstorm': return <CloudLightning className="h-6 w-6 text-yellow-600" />;
      case 'drizzle': return <CloudDrizzle className="h-6 w-6 text-primary/80" />;
      case 'snow': return <CloudSnow className="h-6 w-6 text-primary/30" />;
      default: return <Wind className="h-6 w-6 text-teal-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
        <Loader className="h-6 w-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!weather) return null;

  const temp = Math.round(weather.main.temp);
  const condition = weather.weather[0]?.main || 'Clear';
  const description = weather.weather[0]?.description || 'clear sky';

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 transition-all hover:shadow-md">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-white dark:bg-emerald-950/50 rounded-xl shadow-sm">
          {getWeatherIcon(condition)}
        </div>
        <div>
          <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{weather.name}</h4>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 capitalize">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
          {temp}°C
        </div>
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          Humidity: {weather.main.humidity}%
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
