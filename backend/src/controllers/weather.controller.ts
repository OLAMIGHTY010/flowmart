import { Request, Response } from 'express';
import axios from 'axios';

interface WeatherCache {
    data: any;
    timestamp: number;
}

const weatherCache: Record<string, WeatherCache> = {};
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache

export const getWeather = async (req: Request, res: Response) => {
    try {
        const { lat, lon, city } = req.query;
        
        let queryKey = 'Lagos,NG'; // Default to Lagos
        let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Lagos,NG&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`;

        if (lat && lon) {
            queryKey = `${lat},${lon}`;
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`;
        } else if (city) {
            queryKey = `${city},NG`;
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},NG&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`;
        }

        // Check Cache
        const cached = weatherCache[queryKey];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
            return res.status(200).json({ success: true, data: cached.data });
        }

        if (!process.env.OPENWEATHERMAP_API_KEY) {
             // Mock data if no API key is provided
             const mockData = {
                 main: { temp: 28, humidity: 80 },
                 weather: [{ main: 'Rain', description: 'light rain' }],
                 name: city || 'Lagos'
             };
             return res.status(200).json({ success: true, data: mockData, mock: true });
        }

        const response = await axios.get(apiUrl);
        
        // Save to cache
        weatherCache[queryKey] = {
            data: response.data,
            timestamp: Date.now()
        };

        return res.status(200).json({ success: true, data: response.data });
    } catch (error: any) {
        console.error('Weather API Error:', error.message);
        // Fallback to mock data on error
        const mockData = {
            main: { temp: 28, humidity: 80 },
            weather: [{ main: 'Rain', description: 'light rain' }],
            name: req.query.city || 'Lagos'
        };
        return res.status(200).json({ success: true, data: mockData, mock: true, error: error.message });
    }
};
