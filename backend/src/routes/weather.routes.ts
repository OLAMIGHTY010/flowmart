import { Router } from 'express';
import { getWeather } from '../controllers/weather.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Allow authenticated users to get weather
router.get('/', authenticateJWT, getWeather);

export default router;
